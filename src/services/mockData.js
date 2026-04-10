// Comprehensive mock data for ERP-connected AI chatbot

export const mockDatabaseConnections = [
  {
    id: "conn-1",
    name: "Production ERP",
    type: "postgresql",
    host: "erp-prod.company.com",
    database: "erp_main",
    status: "connected",
    lastSync: "2 mins ago",
    tables: 47,
    color: "#22c55e"
  },
  {
    id: "conn-2", 
    name: "Sales Analytics",
    type: "mysql",
    host: "analytics.company.com",
    database: "sales_db",
    status: "connected",
    lastSync: "5 mins ago",
    tables: 23,
    color: "#3b82f6"
  },
  {
    id: "conn-3",
    name: "Inventory System",
    type: "sqlserver",
    host: "inventory.company.com",
    database: "inv_master",
    status: "disconnected",
    lastSync: "2 hours ago",
    tables: 31,
    color: "#f59e0b"
  }
];

export const mockTables = {
  "conn-1": [
    { name: "customers", rows: 15420, columns: ["id", "name", "email", "region", "created_at"] },
    { name: "orders", rows: 89234, columns: ["id", "customer_id", "total", "status", "date"] },
    { name: "products", rows: 3421, columns: ["id", "name", "category", "price", "stock"] },
    { name: "invoices", rows: 45123, columns: ["id", "order_id", "amount", "paid", "due_date"] },
    { name: "employees", rows: 234, columns: ["id", "name", "department", "role", "salary"] },
    { name: "suppliers", rows: 89, columns: ["id", "name", "contact", "country", "rating"] },
  ],
  "conn-2": [
    { name: "sales_transactions", rows: 234521, columns: ["id", "product_id", "amount", "date", "region"] },
    { name: "marketing_campaigns", rows: 156, columns: ["id", "name", "budget", "roi", "status"] },
    { name: "customer_segments", rows: 12, columns: ["id", "name", "size", "value", "growth"] },
  ]
};

export const mockReports = [
  {
    id: "rep-1",
    title: "Top 10 Sales Items (Last 6M, >10% Margins)",
    query: "Show top 10 sales items from last 6 months with margins above 10%",
    createdAt: "2024-03-15T10:30:00",
    isPinned: true,
    chartType: "bar",
    tables: ["products", "sales_transactions"],
    data: [
      { id: "1", product: "Quantum Server X1", revenue: 145000, margin: 42, quantity: 24, category: "Hardware" },
      { id: "2", product: "Neural Processor Unit", revenue: 98000, margin: 35, quantity: 156, category: "Components" },
      { id: "3", product: "Holographic Display", revenue: 76000, margin: 28, quantity: 89, category: "Displays" },
      { id: "4", product: "Quantum Storage Array", revenue: 54000, margin: 45, quantity: 12, category: "Storage" },
      { id: "5", product: "Synaptic Bridge", revenue: 32000, margin: 60, quantity: 410, category: "Networking" },
      { id: "6", product: "Photonic Router", revenue: 28000, margin: 38, quantity: 67, category: "Networking" },
      { id: "7", product: "AI Accelerator Card", revenue: 24000, margin: 52, quantity: 34, category: "Components" },
      { id: "8", product: "Memory Matrix", revenue: 19000, margin: 33, quantity: 189, category: "Memory" },
      { id: "9", product: "Power Core Unit", revenue: 15000, margin: 41, quantity: 45, category: "Power" },
      { id: "10", product: "Cooling System Pro", revenue: 12000, margin: 29, quantity: 78, category: "Cooling" }
    ],
    chartConfig: {
      xAxis: "product",
      yAxis: ["revenue"],
      colors: ["#2563eb", "#60a5fa", "#93c5fd"],
      showLegend: true,
      showGrid: true
    }
  },
  {
    id: "rep-2",
    title: "Production Losses >5% (March)",
    query: "Generate production report for March where losses exceeded 5%",
    createdAt: "2024-03-14T15:45:00",
    isPinned: true,
    chartType: "bar",
    tables: ["production_orders", "quality_control"],
    data: [
      { id: "1", item: "Synaptic Bridge", defectRate: 8.2, unitsLost: 420, cost: 84000, line: "Line A" },
      { id: "2", item: "Micro-Sensors", defectRate: 5.4, unitsLost: 89, cost: 12500, line: "Line B" },
      { id: "3", item: "Neural Chips", defectRate: 6.1, unitsLost: 156, cost: 31200, line: "Line A" },
      { id: "4", item: "Photonic Cells", defectRate: 5.8, unitsLost: 203, cost: 45600, line: "Line C" },
    ],
    chartConfig: {
      xAxis: "item",
      yAxis: ["defectRate", "unitsLost"],
      colors: ["#ef4444", "#f97316"],
      showLegend: true,
      showGrid: true
    }
  },
  {
    id: "rep-3",
    title: "FY 2025 Purchase Orders (Short Delivery)",
    query: "List purchase orders in FY 2025 with short deliveries",
    createdAt: "2024-03-13T09:20:00",
    isPinned: false,
    chartType: "table",
    tables: ["purchase_orders", "suppliers"],
    data: [
      { id: "1", poNumber: "PO-25-0091", supplier: "GlobalTech Ind.", ordered: 500, received: 425, shortage: 15, value: 125000 },
      { id: "2", poNumber: "PO-25-0142", supplier: "Quantum Parts LLC", ordered: 1200, received: 1104, shortage: 8, value: 89000 },
      { id: "3", poNumber: "PO-25-0188", supplier: "Nexus Supplies", ordered: 300, received: 234, shortage: 22, value: 67500 },
      { id: "4", poNumber: "PO-25-0201", supplier: "TechSource Corp", ordered: 800, received: 720, shortage: 10, value: 156000 },
      { id: "5", poNumber: "PO-25-0234", supplier: "Alpha Materials", ordered: 450, received: 382, shortage: 15, value: 92000 },
    ],
    chartConfig: {
      xAxis: "supplier",
      yAxis: ["shortage"],
      colors: ["#ef4444"],
      showLegend: false,
      showGrid: true
    }
  },
  {
    id: "rep-4",
    title: "Customer Revenue by Region (Q1 2025)",
    query: "Show customer revenue breakdown by region for Q1 2025",
    createdAt: "2024-03-12T14:10:00",
    isPinned: false,
    chartType: "pie",
    tables: ["customers", "orders"],
    data: [
      { region: "North America", revenue: 2450000, customers: 1234, growth: 12 },
      { region: "Europe", revenue: 1890000, customers: 987, growth: 8 },
      { region: "Asia Pacific", revenue: 1650000, customers: 756, growth: 23 },
      { region: "Latin America", revenue: 680000, customers: 345, growth: 15 },
      { region: "Middle East", revenue: 420000, customers: 189, growth: 31 },
    ],
    chartConfig: {
      xAxis: "region",
      yAxis: ["revenue"],
      colors: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
      showLegend: true,
      showGrid: false
    }
  },
  {
    id: "rep-5",
    title: "Monthly Sales Trend (Last 12 Months)",
    query: "Show monthly sales trend for the last 12 months",
    createdAt: "2024-03-11T11:00:00",
    isPinned: true,
    chartType: "line",
    tables: ["sales_transactions"],
    data: [
      { month: "Apr 24", sales: 1200000, orders: 3421, avgOrder: 351 },
      { month: "May 24", sales: 1350000, orders: 3890, avgOrder: 347 },
      { month: "Jun 24", sales: 1180000, orders: 3245, avgOrder: 364 },
      { month: "Jul 24", sales: 1420000, orders: 4012, avgOrder: 354 },
      { month: "Aug 24", sales: 1380000, orders: 3876, avgOrder: 356 },
      { month: "Sep 24", sales: 1560000, orders: 4234, avgOrder: 368 },
      { month: "Oct 24", sales: 1620000, orders: 4456, avgOrder: 364 },
      { month: "Nov 24", sales: 1890000, orders: 5123, avgOrder: 369 },
      { month: "Dec 24", sales: 2340000, orders: 6234, avgOrder: 375 },
      { month: "Jan 25", sales: 1450000, orders: 3987, avgOrder: 364 },
      { month: "Feb 25", sales: 1520000, orders: 4123, avgOrder: 369 },
      { month: "Mar 25", sales: 1680000, orders: 4567, avgOrder: 368 },
    ],
    chartConfig: {
      xAxis: "month",
      yAxis: ["sales"],
      colors: ["#2563eb"],
      showLegend: true,
      showGrid: true
    }
  }
];

export const mockQueryResponses = {
  "sales": {
    tables: ["products", "sales_transactions", "customers"],
    sql: `SELECT 
  p.name as product,
  SUM(s.amount) as revenue,
  ((SUM(s.amount) - SUM(p.cost * s.quantity)) / SUM(s.amount) * 100) as margin,
  SUM(s.quantity) as quantity,
  p.category
FROM products p
JOIN sales_transactions s ON p.id = s.product_id
WHERE s.date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY p.id, p.name, p.category
HAVING margin > 10
ORDER BY revenue DESC
LIMIT 10;`,
    data: mockReports[0].data,
    insights: [
      { type: "positive", text: "Revenue increased 14% compared to previous 6 months" },
      { type: "info", text: "Hardware category leads with 35% of total revenue" },
      { type: "warning", text: "Networking products show declining margins" }
    ]
  },
  "production": {
    tables: ["production_orders", "quality_control", "inventory"],
    sql: `SELECT 
  po.item_name as item,
  (qc.defects / po.quantity * 100) as defect_rate,
  qc.defects as units_lost,
  (qc.defects * po.unit_cost) as cost,
  po.production_line as line
FROM production_orders po
JOIN quality_control qc ON po.id = qc.order_id
WHERE po.production_date BETWEEN '2024-03-01' AND '2024-03-31'
AND (qc.defects / po.quantity * 100) > 5
ORDER BY defect_rate DESC;`,
    data: mockReports[1].data,
    insights: [
      { type: "warning", text: "Line A has highest defect rates - maintenance recommended" },
      { type: "negative", text: "Total loss exceeds $170,000 this month" },
      { type: "info", text: "Synaptic Bridge requires quality review" }
    ]
  },
  "purchase": {
    tables: ["purchase_orders", "suppliers", "receiving"],
    sql: `SELECT 
  po.po_number,
  s.name as supplier,
  po.quantity_ordered as ordered,
  r.quantity_received as received,
  ((po.quantity_ordered - r.quantity_received) / po.quantity_ordered * 100) as shortage,
  po.total_value as value
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
JOIN receiving r ON po.id = r.po_id
WHERE po.fiscal_year = 2025
AND r.quantity_received < po.quantity_ordered
ORDER BY shortage DESC;`,
    data: mockReports[2].data,
    insights: [
      { type: "warning", text: "Nexus Supplies has 22% shortage rate - review contract" },
      { type: "info", text: "Average shortage across vendors is 14%" },
      { type: "action", text: "Consider alternative suppliers for critical items" }
    ]
  }
};

export const chartColors = [
  { name: "Blue", colors: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"] },
  { name: "Green", colors: ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"] },
  { name: "Purple", colors: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"] },
  { name: "Orange", colors: ["#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa"] },
  { name: "Red", colors: ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"] },
  { name: "Teal", colors: ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"] },
  { name: "Pink", colors: ["#db2777", "#ec4899", "#f472b6", "#f9a8d4", "#fbcfe8"] },
  { name: "Indigo", colors: ["#4338ca", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"] },
];

export const chartTypes = [
  { id: "bar", name: "Bar Chart", icon: "BarChart2" },
  { id: "line", name: "Line Chart", icon: "TrendingUp" },
  { id: "area", name: "Area Chart", icon: "Activity" },
  { id: "pie", name: "Pie Chart", icon: "PieChart" },
  { id: "donut", name: "Donut Chart", icon: "Circle" },
  { id: "scatter", name: "Scatter Plot", icon: "Target" },
  { id: "table", name: "Data Table", icon: "Table" },
];

export const mockChatHistory = [
  { id: "chat-1", title: "Top sales analysis", date: "Today", messages: 4 },
  { id: "chat-2", title: "Production losses report", date: "Today", messages: 6 },
  { id: "chat-3", title: "Q1 revenue breakdown", date: "Yesterday", messages: 3 },
  { id: "chat-4", title: "Supplier performance", date: "Yesterday", messages: 8 },
  { id: "chat-5", title: "Inventory turnover", date: "Mar 12", messages: 5 },
  { id: "chat-6", title: "Employee productivity", date: "Mar 10", messages: 7 },
];

export const suggestions = [
  {
    category: "Sales & Revenue",
    prompts: [
      "Create a report for top 10 sales items, which have been sold in last 6 months and have more than 10% margins",
      "Show me customer revenue breakdown by region for Q1 2025",
      "Analyze monthly sales trend for the last 12 months with growth rates",
      "Which products have the highest profit margins this quarter?"
    ]
  },
  {
    category: "Production & Quality",
    prompts: [
      "Generate a production report for all items produced in March, where production losses were more than 5%",
      "Show quality control metrics for Line A and Line B comparison",
      "What are the top defect categories in manufacturing this month?",
      "Production efficiency by shift for the last week"
    ]
  },
  {
    category: "Inventory & Procurement",
    prompts: [
      "Give a list of purchase orders in FY 2025, which were short on delivery",
      "Show me inventory items below reorder point",
      "Supplier performance scorecard for the last quarter",
      "Which items have the longest lead times?"
    ]
  },
  {
    category: "Finance & Analytics",
    prompts: [
      "Generate accounts receivable aging report",
      "Show cash flow projection for next 3 months",
      "Compare budget vs actual for each department",
      "What are the top expense categories this year?"
    ]
  }
];

export const kpiData = [
  { label: "Total Revenue", value: "$2.4M", change: "+14.2%", type: "positive", trend: [65, 72, 68, 80, 75, 85, 90] },
  { label: "Active Orders", value: "1,247", change: "+8.1%", type: "positive", trend: [40, 45, 42, 48, 52, 55, 58] },
  { label: "Avg Margin", value: "32.4%", change: "+2.4%", type: "positive", trend: [28, 29, 30, 31, 30, 32, 32] },
  { label: "Inventory Value", value: "$890K", change: "-3.2%", type: "negative", trend: [95, 92, 90, 88, 89, 87, 86] },
];
