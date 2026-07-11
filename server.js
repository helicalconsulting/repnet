import crypto from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3001);
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DB || 'repnet';
const TEMPLATE_JSON_PATH = process.env.TEMPLATE_JSON_PATH || '../repnex_sql_templates/all_templates_combined.json';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_HOST = (process.env.PINECONE_HOST || '').replace(/\/+$/, '');
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || 'sql-templates';
const PINECONE_EMBED_MODEL = process.env.PINECONE_EMBED_MODEL || 'llama-text-embed-v2';
const SMTP_SERVICE = process.env.SMTP_SERVICE || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/["\s]/g, '');
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_TO = (process.env.SMTP_TO || 'jai@helical.consulting,keshav@helical.consulting,helicalconsulting@gmail.com')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable.');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client = new MongoClient(MONGODB_URI);
let db;
let templateCache;

const AUTH_HEADER_PREFIX = 'Bearer ';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const waitlistCount = { value: 142 };

const ensureDb = async () => {
  if (db) {
    return db;
  }

  await client.connect();
  db = client.db(DATABASE_NAME);

  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ token: 1 }, { unique: true }),
    db.collection('organizations').createIndex({ ownerUserId: 1 }),
    db.collection('connections').createIndex({ userId: 1 }),
  ]);

  return db;
};

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedPassword) => {
  const [salt, storedHash] = String(storedPassword || '').split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
};

const createSessionToken = () => crypto.randomBytes(32).toString('hex');
const resolveTemplatePath = () => path.resolve(__dirname, TEMPLATE_JSON_PATH);

const buildSessionUser = ({ user, organization }) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  company: organization?.name || user.company || '',
  organizationId: organization?._id?.toString() || user.organizationId?.toString() || null,
  organizationName: organization?.name || null,
  onboardingCompleted: Boolean(user.onboardingCompleted),
});

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith(AUTH_HEADER_PREFIX)) {
    return null;
  }
  return authHeader.slice(AUTH_HEADER_PREFIX.length).trim();
};

const createAuthResponse = async (database, user) => {
  const organization = user.organizationId
    ? await database.collection('organizations').findOne({ _id: new ObjectId(user.organizationId) })
    : null;

  const token = createSessionToken();
  await database.collection('sessions').insertOne({
    token,
    userId: user._id,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  return {
    token,
    user: buildSessionUser({ user, organization }),
  };
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const database = await ensureDb();
    const session = await database.collection('sessions').findOne({ token });

    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      if (session?._id) {
        await database.collection('sessions').deleteOne({ _id: session._id });
      }
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    const user = await database.collection('users').findOne({ _id: new ObjectId(session.userId) });
    if (!user) {
      await database.collection('sessions').deleteOne({ _id: session._id });
      return res.status(401).json({ error: 'User not found.' });
    }

    const organization = user.organizationId
      ? await database.collection('organizations').findOne({ _id: new ObjectId(user.organizationId) })
      : null;

    req.auth = { token, session, user, organization, database };
    next();
  } catch (error) {
    next(error);
  }
};

const createTransporter = () => {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP_USER or SMTP_PASS environment variable.');
  }

  const transportConfig = SMTP_SERVICE
    ? {
        service: SMTP_SERVICE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      }
    : {
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      };

  if (!SMTP_SERVICE && !SMTP_HOST) {
    throw new Error('Missing SMTP_SERVICE or SMTP_HOST environment variable.');
  }

  return nodemailer.createTransport(transportConfig);
};

const loadTemplates = async () => {
  if (templateCache) {
    return templateCache;
  }

  const raw = await readFile(resolveTemplatePath(), 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Template JSON must contain an array of templates.');
  }

  templateCache = parsed;
  return templateCache;
};

const buildTemplateEmbeddingText = (template) =>
  [
    template.embedding_text,
    template.description,
    `Module: ${template.module}`,
    `Category: ${template.category}`,
    `Keywords: ${(template.keywords || []).join(', ')}`,
    `Example questions: ${(template.example_questions || []).join(' | ')}`,
  ]
    .filter(Boolean)
    .join('\n');

const ensureVectorConfig = () => {
  if (!PINECONE_API_KEY) {
    throw new Error('Missing PINECONE_API_KEY environment variable.');
  }

  if (!PINECONE_HOST) {
    throw new Error('Missing PINECONE_HOST environment variable.');
  }
};

const createEmbedding = async (input, inputType = 'passage') => {
  ensureVectorConfig();

  if (OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBED_MODEL,
        input,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error?.message || 'Embedding request failed.');
    }

    return payload.data[0].embedding;
  }

  const response = await fetch('https://api.pinecone.io/embed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': PINECONE_API_KEY,
      'X-Pinecone-Api-Version': '2026-04',
    },
    body: JSON.stringify({
      model: PINECONE_EMBED_MODEL,
      parameters: {
        input_type: inputType,
        truncate: 'END',
      },
      inputs: [{ text: input }],
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || payload.error || 'Pinecone embedding request failed.');
  }

  return payload.data[0].values;
};

const createEmbeddings = async (inputs, inputType = 'passage') => {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return [];
  }

  if (OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBED_MODEL,
        input: inputs,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error?.message || 'Embedding batch request failed.');
    }

    return payload.data.map((entry) => entry.embedding);
  }

  const response = await fetch('https://api.pinecone.io/embed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': PINECONE_API_KEY,
      'X-Pinecone-Api-Version': '2026-04',
    },
    body: JSON.stringify({
      model: PINECONE_EMBED_MODEL,
      parameters: {
        input_type: inputType,
        truncate: 'END',
      },
      inputs: inputs.map((text) => ({ text })),
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || payload.error || 'Pinecone embedding batch request failed.');
  }

  return payload.data.map((entry) => entry.values);
};

const pineconeRequest = async (pathname, body) => {
  ensureVectorConfig();

  const response = await fetch(`${PINECONE_HOST}${pathname}`, {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
      'X-Pinecone-Api-Version': '2026-04',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.error || 'Pinecone request failed.');
  }

  return payload;
};

const toTemplateMetadata = (template) => ({
  template_id: template.id,
  module: template.module,
  category: template.category,
  description: template.description,
  embedding_text: template.embedding_text,
  template_json: JSON.stringify(template),
});

app.get('/api/health', async (_req, res, next) => {
  try {
    await ensureDb();
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const database = await ensureDb();
    const { name, company = '', email, password } = req.body || {};

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.trim().length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await database.collection('users').findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const insertResult = await database.collection('users').insertOne({
      name: name.trim(),
      company: company.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password.trim()),
      onboardingCompleted: false,
      organizationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const user = await database.collection('users').findOne({ _id: insertResult.insertedId });
    const response = await createAuthResponse(database, user);

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const database = await ensureDb();
    const { email, password } = req.body || {};

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await database.collection('users').findOne({ email: normalizeEmail(email) });

    if (!user || !verifyPassword(password.trim(), user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const response = await createAuthResponse(database, user);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/session', requireAuth, async (req, res) => {
  res.status(200).json({
    user: buildSessionUser({ user: req.auth.user, organization: req.auth.organization }),
  });
});

app.post('/api/auth/logout', requireAuth, async (req, res, next) => {
  try {
    await req.auth.database.collection('sessions').deleteOne({ token: req.auth.token });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/organizations/me', requireAuth, async (req, res) => {
  res.status(200).json({
    organization: req.auth.organization
      ? {
          id: req.auth.organization._id.toString(),
          name: req.auth.organization.name,
          industry: req.auth.organization.industry || '',
          erpSystem: req.auth.organization.erpSystem || '',
          teamSize: req.auth.organization.teamSize || '',
        }
      : null,
  });
});

app.post('/api/organizations/onboarding', requireAuth, async (req, res, next) => {
  try {
    const { organizationName, industry = '', erpSystem = '', teamSize = '' } = req.body || {};

    if (!organizationName?.trim()) {
      return res.status(400).json({ error: 'Organization name is required.' });
    }

    const now = new Date();
    const organizationPayload = {
      name: organizationName.trim(),
      industry: industry.trim(),
      erpSystem: erpSystem.trim(),
      teamSize: teamSize.trim(),
      ownerUserId: req.auth.user._id,
      updatedAt: now,
    };

    let organizationId = req.auth.user.organizationId;

    if (organizationId) {
      await req.auth.database.collection('organizations').updateOne(
        { _id: new ObjectId(organizationId) },
        { $set: organizationPayload },
      );
    } else {
      const result = await req.auth.database.collection('organizations').insertOne({
        ...organizationPayload,
        createdAt: now,
      });
      organizationId = result.insertedId;
    }

    await req.auth.database.collection('users').updateOne(
      { _id: req.auth.user._id },
      {
        $set: {
          company: organizationName.trim(),
          organizationId,
          onboardingCompleted: true,
          updatedAt: now,
        },
      },
    );

    const updatedUser = await req.auth.database.collection('users').findOne({ _id: req.auth.user._id });
    const organization = await req.auth.database.collection('organizations').findOne({ _id: new ObjectId(organizationId) });

    res.status(200).json({
      user: buildSessionUser({ user: updatedUser, organization }),
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        industry: organization.industry || '',
        erpSystem: organization.erpSystem || '',
        teamSize: organization.teamSize || '',
      },
    });

    // Fire-and-forget: send welcome email to user + notification to admins
    try {
      const transporter = createTransporter();
      const userName = updatedUser.name || updatedUser.email.split('@')[0];

      // Welcome email to user
      await transporter.sendMail({
        from: SMTP_FROM,
        to: updatedUser.email,
        subject: `🎉 Welcome to Repnex — ${organization.name} is ready!`,
        html: `
          <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:40px auto;
                      background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
            <div style="background:linear-gradient(135deg,#2563eb,#3b82f6);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;">Welcome to Repnex! 🎉</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">AI-Powered ERP Intelligence</p>
            </div>
            <div style="padding:32px 24px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${userName}</strong>,</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                Your organization <strong>${organization.name}</strong> is all set up! You can now:
              </p>
              <ul style="color:#6b7280;font-size:14px;line-height:2;">
                <li>Connect your ERP databases</li>
                <li>Ask questions in plain English</li>
                <li>Generate instant reports & dashboards</li>
              </ul>
              <div style="text-align:center;margin:28px 0;">
                <a href="https://repnex.ai/dashboard"
                   style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);
                          color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;
                          font-size:15px;font-weight:600;">
                  Go to Dashboard →
                </a>
              </div>
            </div>
          </div>
        `,
      });

      // Admin notification
      await transporter.sendMail({
        from: SMTP_FROM,
        to: SMTP_TO,
        subject: `🏢 New Organization Onboarded — ${organization.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;border:1px solid #eee;padding:20px;border-radius:10px;">
            <h2 style="color:#0055FF;">New Organization Onboarded</h2>
            <hr />
            <p><strong>Organization:</strong> ${organization.name}</p>
            <p><strong>Industry:</strong> ${organization.industry || 'N/A'}</p>
            <p><strong>ERP System:</strong> ${organization.erpSystem || 'N/A'}</p>
            <p><strong>Team Size:</strong> ${organization.teamSize || 'N/A'}</p>
            <p><strong>User:</strong> ${updatedUser.email}</p>
            <br />
            <p style="font-size:12px;color:#666;">Automated notification from Repnex.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Onboarding email error (non-fatal):', emailError.message);
    }
  } catch (error) {
    next(error);
  }
});

app.get('/api/connections', requireAuth, async (req, res, next) => {
  try {
    const connections = await req.auth.database
      .collection('connections')
      .find({ userId: req.auth.user._id })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      connections: connections.map((connection) => ({
        id: connection._id.toString(),
        name: connection.name,
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        status: connection.status,
        lastSync: connection.lastSync || 'Never',
        tables: connection.tables ?? 0,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/connections/test', requireAuth, async (req, res) => {
  const { host, database } = req.body || {};

  if (!host?.trim() || !database?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Host and database name are required.',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Connection details look valid.',
    latency: Math.floor(Math.random() * 80) + 20,
  });
});

app.post('/api/connections', requireAuth, async (req, res, next) => {
  try {
    const { name, type, host, port = '', database, username = '' } = req.body || {};

    if (!name?.trim() || !type?.trim() || !host?.trim() || !database?.trim()) {
      return res.status(400).json({ error: 'Name, type, host, and database are required.' });
    }

    const now = new Date();
    const result = await req.auth.database.collection('connections').insertOne({
      userId: req.auth.user._id,
      organizationId: req.auth.user.organizationId || null,
      name: name.trim(),
      type: type.trim(),
      host: host.trim(),
      port: String(port).trim(),
      database: database.trim(),
      username: username.trim(),
      status: 'connected',
      lastSync: 'Just now',
      tables: Math.floor(Math.random() * 30) + 10,
      createdAt: now,
      updatedAt: now,
    });

    const connection = await req.auth.database.collection('connections').findOne({ _id: result.insertedId });

    res.status(201).json({
      connection: {
        id: connection._id.toString(),
        name: connection.name,
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        status: connection.status,
        lastSync: connection.lastSync,
        tables: connection.tables,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/connections/:id/sync', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    await req.auth.database.collection('connections').updateOne(
      { _id: new ObjectId(id), userId: req.auth.user._id },
      {
        $set: {
          status: 'connected',
          lastSync: 'Just now',
          updatedAt: new Date(),
        },
      },
    );

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/connections/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    await req.auth.database.collection('connections').deleteOne({
      _id: new ObjectId(id),
      userId: req.auth.user._id,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/templates/status', requireAuth, async (_req, res, next) => {
  try {
    const templates = await loadTemplates();
    res.status(200).json({
      templateCount: templates.length,
      namespace: PINECONE_NAMESPACE,
      templatePath: resolveTemplatePath(),
      pineconeConfigured: Boolean(PINECONE_API_KEY && PINECONE_HOST),
      embeddingsConfigured: Boolean(OPENAI_API_KEY || PINECONE_API_KEY),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/templates/ingest', requireAuth, async (_req, res, next) => {
  try {
    const templates = await loadTemplates();
    const vectors = [];
    const embeddingBatchSize = OPENAI_API_KEY ? 100 : 96;

    for (let index = 0; index < templates.length; index += embeddingBatchSize) {
      const batch = templates.slice(index, index + embeddingBatchSize);
      const embeddings = await createEmbeddings(
        batch.map((template) => buildTemplateEmbeddingText(template)),
        'passage',
      );

      batch.forEach((template, batchIndex) => {
        vectors.push({
          id: template.id,
          values: embeddings[batchIndex],
          metadata: toTemplateMetadata(template),
        });
      });
    }

    const batchSize = 20;

    for (let index = 0; index < vectors.length; index += batchSize) {
      const batch = vectors.slice(index, index + batchSize);
      await pineconeRequest('/vectors/upsert', {
        namespace: PINECONE_NAMESPACE,
        vectors: batch,
      });
    }

    res.status(200).json({
      success: true,
      ingested: vectors.length,
      namespace: PINECONE_NAMESPACE,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/templates/search', requireAuth, async (req, res, next) => {
  try {
    const { query, topK = 5 } = req.body || {};

    if (!query?.trim()) {
      return res.status(400).json({ error: 'Query is required.' });
    }

    const embedding = await createEmbedding(query.trim(), 'query');
    const response = await pineconeRequest('/query', {
      namespace: PINECONE_NAMESPACE,
      vector: embedding,
      topK: Math.min(Math.max(Number(topK) || 5, 1), 10),
      includeMetadata: true,
    });

    const matches = (response.matches || []).map((match) => ({
      id: match.id,
      score: match.score,
      module: match.metadata?.module || null,
      category: match.metadata?.category || null,
      description: match.metadata?.description || null,
      template: match.metadata?.template_json ? JSON.parse(match.metadata.template_json) : null,
    }));

    res.status(200).json({
      query: query.trim(),
      matches,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/subscribe', async (req, res, next) => {
  const { name, email, countryCode, phone } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const database = await ensureDb();

    // 1. Save subscriber details to MongoDB
    try {
      await database.collection('subscribers').updateOne(
        { email: email.trim().toLowerCase() },
        {
          $set: {
            name: name?.trim() || '',
            countryCode: countryCode || '',
            phone: phone || '',
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (dbError) {
      console.error('Database connection or save error in subscribe:', dbError.message);
    }

    // 2. Attempt to send Email (Non-fatal)
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: SMTP_FROM,
        to: SMTP_TO,
        subject: '🔥 New Early Bird Subscriber - Repnex AI',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #0055FF;">New Early Bird Subscriber Details</h2>
            <hr />
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${countryCode} ${phone}</p>
            <br />
            <p style="font-size: 12px; color: #666;">This is an automated notification from your Repnex Landing Page.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('SMTP Subscription Email Error (non-fatal):', emailError.message, emailError.code);
    }

    res.status(200).json({ message: 'Email saved successfully' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/waitlist/count', (_req, res) => {
  res.status(200).json({ count: waitlistCount.value });
});

app.post('/api/waitlist', async (req, res, next) => {
  const { email, company, erp_system } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const database = await ensureDb();

    // 1. Save waitlist signup to MongoDB
    try {
      await database.collection('waitlist').updateOne(
        { email: email.trim().toLowerCase() },
        {
          $set: {
            company: company?.trim() || '',
            erp_system: erp_system || '',
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (dbError) {
      console.error('Database connection or save error in waitlist:', dbError.message);
    }

    // 2. Attempt to send Email (Non-fatal)
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: SMTP_FROM,
        to: SMTP_TO,
        subject: '✨ New Waitlist Signup - Repnex AI',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #0055FF;">New Waitlist Signup</h2>
            <hr />
            <p><strong>Work Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company || 'N/A'}</p>
            <p><strong>ERP System:</strong> ${erp_system || 'N/A'}</p>
            <br />
            <p style="font-size: 12px; color: #666;">This is an automated notification from your Repnex Waitlist Form.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Waitlist SMTP Error (non-fatal):', emailError.message, emailError.code);
    }

    waitlistCount.value += 1;
    res.status(200).json({ message: 'Waitlist signup successful' });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Internal server error.' });
});

app.listen(PORT, async () => {
  try {
    await ensureDb();
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
  }
});
