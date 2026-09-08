// AI Service - Mock implementation with realistic analysis
// In production, this would connect to an actual AI/ML service

const categoryKeywords = {
  'Pothole/Road Damage': ['pothole', 'road damage', 'crack', 'road repair', 'broken road', 'uneven road', 'road surface', 'asphalt', 'speed bump'],
  'Garbage/Waste': ['garbage', 'waste', 'trash', 'litter', 'bin', 'dustbin', 'overflowing', 'dirty', 'cleanup', 'smell'],
  'Streetlight': ['streetlight', 'street light', 'lamp', 'dark', 'light not working', 'bulb', 'lamp post', 'flickering light'],
  'Water Leakage': ['water leak', 'pipe burst', 'water pipe', 'leaking', 'water supply', 'water meter', 'contamination', 'water quality'],
  'Drainage/Sewage': ['drainage', 'sewage', 'drain', 'clogged', 'blocked drain', 'manhole', 'waterlogging', 'flooding', 'storm water'],
  'Traffic/Safety': ['traffic', 'signal', 'accident', 'vehicle', 'congestion', 'speed', 'parking', 'abandoned vehicle'],
  'Public Property Damage': ['bench', 'fence', 'footpath', 'pavement', 'tiles', 'railing', 'public property', 'vandalism'],
  'Electricity': ['electrical', 'wire', 'exposed wire', 'power', 'transformer', 'sparking', 'power outage', 'power line'],
  'Parks/Public Spaces': ['park', 'garden', 'tree', 'playground', 'grass', 'fallen tree', 'branch'],
  'Illegal Dumping': ['dumping', 'illegal dump', 'construction waste', 'debris', 'mosquito', 'stagnant water', 'breeding'],
  'Road Signs': ['road sign', 'stop sign', 'sign board', 'missing sign', 'direction board'],
  'Other': ['noise', 'construction', 'nuisance']
};

const departmentMapping = {
  'Pothole/Road Damage': { name: 'Roads & Infrastructure', code: 'ROADS', id: 1 },
  'Garbage/Waste': { name: 'Sanitation & Waste', code: 'SANITATION', id: 2 },
  'Streetlight': { name: 'Electrical Department', code: 'ELECTRICAL', id: 3 },
  'Water Leakage': { name: 'Water & Sewage', code: 'WATER', id: 4 },
  'Drainage/Sewage': { name: 'Water & Sewage', code: 'WATER', id: 4 },
  'Traffic/Safety': { name: 'Traffic & Transportation', code: 'TRAFFIC', id: 5 },
  'Public Property Damage': { name: 'Public Works', code: 'PUBLICWORKS', id: 7 },
  'Electricity': { name: 'Electrical Department', code: 'ELECTRICAL', id: 3 },
  'Parks/Public Spaces': { name: 'Parks & Recreation', code: 'PARKS', id: 6 },
  'Illegal Dumping': { name: 'Environmental Services', code: 'ENVIRONMENT', id: 8 },
  'Road Signs': { name: 'Traffic & Transportation', code: 'TRAFFIC', id: 5 },
  'Other': { name: 'Public Works', code: 'PUBLICWORKS', id: 7 }
};

const safetyRiskMapping = {
  'Pothole/Road Damage': 'Vehicle/Accident Hazard - Risk of tire damage or vehicle accidents',
  'Garbage/Waste': 'Health Hazard - Risk of disease spread and pest infestation',
  'Streetlight': 'Pedestrian Safety Risk - Poor visibility increases crime and accident risk',
  'Water Leakage': 'Infrastructure Damage - Water waste and road erosion risk',
  'Drainage/Sewage': 'Health & Flooding Hazard - Risk of waterborne diseases and property damage',
  'Traffic/Safety': 'Accident Hazard - High risk of road accidents and injuries',
  'Public Property Damage': 'Minor Safety Risk - Potential injury from damaged infrastructure',
  'Electricity': 'Severe Electrical Hazard - Risk of electrocution and fire',
  'Parks/Public Spaces': 'Moderate Risk - Fallen trees/structures may cause injury',
  'Illegal Dumping': 'Environmental & Health Hazard - Pest breeding and pollution',
  'Road Signs': 'Traffic Safety Risk - Drivers may miss important traffic information',
  'Other': 'Low Risk - General civic inconvenience'
};

async function callGroqAI(title, description, categoryName) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `You are an AI civic complaint classifier for a municipal smart city system.
Analyze the following public complaint:
Title: "${title}"
Description: "${description}"
${categoryName ? `User-Selected Category: "${categoryName}"` : ''}

Categories and Departments:
- "Pothole/Road Damage" -> Department: Roads & Infrastructure
- "Garbage/Waste" -> Department: Sanitation & Waste
- "Streetlight" -> Department: Electrical Department
- "Water Leakage" -> Department: Water & Sewage
- "Drainage/Sewage" -> Department: Water & Sewage
- "Traffic/Safety" -> Department: Traffic & Transportation
- "Public Property Damage" -> Department: Public Works
- "Electricity" -> Department: Electrical Department
- "Parks/Public Spaces" -> Department: Parks & Recreation
- "Illegal Dumping" -> Department: Environmental Services
- "Road Signs" -> Department: Traffic & Transportation
- "Other" -> Department: Public Works

Respond with a single valid JSON object only (no markdown, no backticks, no preamble) with these keys:
{
  "category": "<one of the exact category names listed above>",
  "severity": "Low" | "Medium" | "High",
  "severityScore": <integer from 1 to 10, where 1 is minor inconvenience and 10 is immediate hazard to life or critical failure>,
  "priority": "low" | "medium" | "high" | "critical",
  "safetyRisk": "<brief hazard and safety risk description>",
  "resolutionTime": "<e.g. 12-24 hours, 24-48 hours, 3-5 business days, 5-7 business days>",
  "summary": "<clear 1-2 sentence professional summary of the problem and recommendation>",
  "confidence": <float between 0.85 and 0.99>
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: 'You are an expert AI civic assistant. Output only strict JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Groq API returned status ${res.status}: ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.warn('Groq AI analysis error (falling back to local rules):', err.message);
    return null;
  }
}

async function analyzeComplaint(title, description, categoryName) {
  // Try Groq LLM first if API key is provided
  const groqResult = await callGroqAI(title, description, categoryName);
  if (groqResult && groqResult.category) {
    const matchedCategory = categoryKeywords[groqResult.category] ? groqResult.category : (categoryName || 'Other');
    const department = departmentMapping[matchedCategory] || departmentMapping['Other'];
    const score = Math.max(1, Math.min(10, parseInt(groqResult.severityScore, 10) || 5));
    const prio = ['low', 'medium', 'high', 'critical'].includes(groqResult.priority) ? groqResult.priority : (score >= 9 ? 'critical' : score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low');

    return {
      category: matchedCategory,
      severity: groqResult.severity || (score > 7 ? 'High' : score > 4 ? 'Medium' : 'Low'),
      severityScore: score,
      priority: prio,
      department: department.name,
      departmentId: department.id,
      safetyRisk: groqResult.safetyRisk || (safetyRiskMapping[matchedCategory] || 'General civic issue'),
      resolutionTime: groqResult.resolutionTime || (prio === 'critical' ? '12-24 hours' : prio === 'high' ? '24-48 hours' : '3-5 business days'),
      summary: groqResult.summary || `${matchedCategory} issue reported: ${title}`,
      confidence: typeof groqResult.confidence === 'number' ? Math.round(groqResult.confidence * 100) / 100 : 0.95,
      aiProvider: 'Groq AI (Qwen 3.8 27B)'
    };
  }

  // Fallback: Local rule-based heuristic analysis
  const text = `${title} ${description}`.toLowerCase();

  // Detect category from text
  let detectedCategory = categoryName || 'Other';
  let maxScore = 0;

  if (!categoryName) {
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score += keyword.split(' ').length; // Multi-word matches score higher
        }
      });
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category;
      }
    }
  }

  // Calculate severity (1-10)
  let severity = 5;
  const urgentWords = ['urgent', 'immediate', 'dangerous', 'emergency', 'critical', 'severe', 'hazard', 'risk', 'accident', 'electrocution', 'flooding', 'burst'];
  const moderateWords = ['broken', 'damaged', 'not working', 'blocked', 'overflowing', 'missing'];
  const lowWords = ['minor', 'small', 'slight', 'cosmetic'];

  urgentWords.forEach(w => { if (text.includes(w)) severity += 1.5; });
  moderateWords.forEach(w => { if (text.includes(w)) severity += 0.5; });
  lowWords.forEach(w => { if (text.includes(w)) severity -= 1; });

  // Category-based severity boost
  if (['Electricity', 'Traffic/Safety'].includes(detectedCategory)) severity += 1;
  if (['Drainage/Sewage', 'Water Leakage'].includes(detectedCategory) && text.includes('burst')) severity += 2;

  severity = Math.max(1, Math.min(10, Math.round(severity)));

  // Determine priority
  let priority = 'medium';
  if (severity >= 9) priority = 'critical';
  else if (severity >= 7) priority = 'high';
  else if (severity >= 4) priority = 'medium';
  else priority = 'low';

  // Get department
  const department = departmentMapping[detectedCategory] || departmentMapping['Other'];

  // Safety risk
  const safetyRisk = safetyRiskMapping[detectedCategory] || 'Low Risk';

  // Resolution time estimate
  let resolutionTime = '3-5 business days';
  if (priority === 'critical') resolutionTime = '12-24 hours';
  else if (priority === 'high') resolutionTime = '24-48 hours';
  else if (priority === 'medium') resolutionTime = '3-5 business days';
  else resolutionTime = '5-7 business days';

  // Generate summary
  const summary = `${detectedCategory} issue reported: ${title}. Severity assessed as ${severity}/10 (${priority} priority). ${safetyRisk.split(' - ')[0]}. Recommended department: ${department.name}. Estimated resolution: ${resolutionTime}.`;

  // Confidence score
  const confidence = categoryName ? 0.95 : Math.min(0.95, 0.65 + (maxScore * 0.05));

  return {
    category: detectedCategory,
    severity: severity > 7 ? 'High' : severity > 4 ? 'Medium' : 'Low',
    severityScore: severity,
    priority,
    department: department.name,
    departmentId: department.id,
    safetyRisk,
    resolutionTime,
    summary,
    confidence: Math.round(confidence * 100) / 100,
    aiProvider: 'Local Rule Engine'
  };
}

async function findDuplicates(db, latitude, longitude, categoryId, description, radiusKm = 0.5) {
  if (!latitude || !longitude) return [];

  // Simple distance calculation using coordinate difference
  const latDiff = radiusKm / 111;
  const lngDiff = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

  const nearby = await db.prepare(`
    SELECT c.*, cc.name as category_name,
    ABS(c.latitude - ?) * 111 as distance_km
    FROM complaints c
    LEFT JOIN complaint_categories cc ON c.category_id = cc.id
    WHERE c.latitude BETWEEN ? AND ?
    AND c.longitude BETWEEN ? AND ?
    AND c.status NOT IN ('closed', 'rejected')
    AND c.category_id = ?
    ORDER BY distance_km ASC
    LIMIT 5
  `).all(
    latitude,
    latitude - latDiff, latitude + latDiff,
    longitude - lngDiff, longitude + lngDiff,
    categoryId
  );

  return nearby.map(c => ({
    id: c.id,
    complaintId: c.complaint_id,
    title: c.title,
    category: c.category_name,
    status: c.status,
    distance: Math.round(c.distance_km * 1000), // meters
    upvotes: c.upvote_count,
    createdAt: c.created_at
  }));
}

async function callGroqInsights(statsSummary) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `You are an AI civic intelligence director for a municipal smart city dashboard.
Analyze these city-wide complaint statistics:
- Hotspot Area: ${statsSummary.hotspotArea || 'None'} (${statsSummary.hotspotCount || 0} complaints)
- Trending Issue: ${statsSummary.trendingCategory || 'None'} (${statsSummary.trendingCount || 0} complaints this week)
- Overdue Complaints: ${statsSummary.overdueCount || 0} past SLA deadline
- Critical Complaints: ${statsSummary.criticalCount || 0} urgent hazards active
- Recurring Clusters: ${statsSummary.clusterSummary || 'None'}
- Avg Resolution Time: ${statsSummary.avgDays || 'N/A'} days

Generate 3 to 5 concise, high-impact municipal intelligence insights and actionable alerts.
Respond with a single valid JSON object containing an "insights" array:
{
  "insights": [
    {
      "type": "<string, e.g. Hotspot Alert, SLA Escalation, Public Safety, Infrastructure Hazard>",
      "icon": "<single emoji, e.g. 🔥, ⚠️, 🚨, 🚰, 📈, ⏱️>",
      "message": "<1-2 clear sentences with realistic municipal insight and recommended action>",
      "severity": "critical" | "high" | "medium" | "low"
    }
  ]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: 'You are an expert AI civic intelligence director. Output only strict JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) return null;

    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.insights)) return parsed.insights;
    return null;
  } catch (err) {
    console.warn('Groq AI insights error (falling back to rules):', err.message);
    return null;
  }
}

async function generateInsights(db) {
  // Area with most complaints
  const hotspot = await db.prepare(`
    SELECT area, COUNT(*) as count FROM complaints
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY area ORDER BY count DESC LIMIT 1
  `).get();

  // Category trend
  const trending = await db.prepare(`
    SELECT cc.name, COUNT(*) as count FROM complaints c
    JOIN complaint_categories cc ON c.category_id = cc.id
    WHERE c.created_at > datetime('now', '-7 days')
    GROUP BY c.category_id ORDER BY count DESC LIMIT 1
  `).get();

  // Overdue complaints
  const overdue = await db.prepare(`
    SELECT COUNT(*) as count FROM complaints
    WHERE status NOT IN ('resolved','closed','rejected')
    AND sla_deadline < datetime('now')
  `).get();

  // Critical complaints
  const critical = await db.prepare(`
    SELECT COUNT(*) as count FROM complaints
    WHERE priority = 'critical' AND status NOT IN ('resolved','closed','rejected')
  `).get();

  // Duplicate cluster
  const clusters = await db.prepare(`
    SELECT area, cc.name as category, COUNT(*) as count FROM complaints c
    JOIN complaint_categories cc ON c.category_id = cc.id
    WHERE c.created_at > datetime('now', '-14 days')
    GROUP BY c.area, c.category_id HAVING count >= 3
    ORDER BY count DESC LIMIT 3
  `).all();

  // Resolution performance
  const avgRes = await db.prepare(`
    SELECT AVG(JULIANDAY(resolved_at) - JULIANDAY(created_at)) as avg_days
    FROM complaints WHERE resolved_at IS NOT NULL AND created_at > datetime('now', '-30 days')
  `).get();

  // Try Groq LLM for intelligent executive insights
  if (process.env.GROQ_API_KEY) {
    const statsSummary = {
      hotspotArea: hotspot?.area,
      hotspotCount: hotspot?.count,
      trendingCategory: trending?.name,
      trendingCount: trending?.count,
      overdueCount: overdue?.count || 0,
      criticalCount: critical?.count || 0,
      clusterSummary: clusters.map(c => `${c.count} ${c.category} in ${c.area}`).join(', '),
      avgDays: avgRes?.avg_days ? (Math.round(avgRes.avg_days * 10) / 10) : null
    };

    const aiInsights = await callGroqInsights(statsSummary);
    if (aiInsights && aiInsights.length > 0) {
      return aiInsights;
    }
  }

  // Fallback: Heuristic rule-based insights
  const insights = [];

  if (hotspot) {
    insights.push({
      type: 'hotspot',
      icon: '🔥',
      message: `${hotspot.area} is the top complaint hotspot with ${hotspot.count} complaints this month.`,
      severity: 'high'
    });
  }

  if (trending) {
    insights.push({
      type: 'trend',
      icon: '📈',
      message: `"${trending.name}" is the most reported issue type this week with ${trending.count} complaints.`,
      severity: 'medium'
    });
  }

  if (overdue && overdue.count > 0) {
    insights.push({
      type: 'overdue',
      icon: '⚠️',
      message: `${overdue.count} complaints are past their SLA deadline and require immediate attention.`,
      severity: 'critical'
    });
  }

  if (critical && critical.count > 0) {
    insights.push({
      type: 'critical',
      icon: '🚨',
      message: `${critical.count} critical-priority complaints are currently active and need urgent resolution.`,
      severity: 'critical'
    });
  }

  clusters.forEach(cl => {
    insights.push({
      type: 'cluster',
      icon: '📍',
      message: `${cl.count} similar "${cl.category}" complaints reported in ${cl.area} in the last 2 weeks.`,
      severity: 'medium'
    });
  });

  if (avgRes && avgRes.avg_days) {
    insights.push({
      type: 'performance',
      icon: '⏱️',
      message: `Average resolution time this month: ${Math.round(avgRes.avg_days * 10) / 10} days.`,
      severity: avgRes.avg_days > 5 ? 'high' : 'low'
    });
  }

  return insights;
}

module.exports = { analyzeComplaint, findDuplicates, generateInsights };


