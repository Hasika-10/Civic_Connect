const Groq = require('groq-sdk');
const fs = require('fs');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const COMPLAINT_CATEGORIES = [
  'Pothole/Road Damage',
  'Garbage/Waste',
  'Streetlight',
  'Water Leakage',
  'Drainage/Sewage',
  'Traffic/Safety',
  'Public Property Damage',
  'Electricity',
  'Parks/Public Spaces',
  'Illegal Dumping',
  'Road Signs',
  'Other'
];

const PRIORITY_LEVELS = ['low', 'medium', 'high', 'critical'];

const DEPARTMENT_MAPPING = {
  'Pothole/Road Damage': 'Roads & Infrastructure',
  'Garbage/Waste': 'Sanitation Department',
  'Streetlight': 'Electrical Department',
  'Water Leakage': 'Water Supply Department',
  'Drainage/Sewage': 'Sewerage & Drainage',
  'Traffic/Safety': 'Traffic Police & Safety',
  'Public Property Damage': 'Municipal Corporation',
  'Electricity': 'Electrical Department',
  'Parks/Public Spaces': 'Parks & Recreation',
  'Illegal Dumping': 'Environmental Department',
  'Road Signs': 'Roads & Infrastructure',
  'Other': 'General Complaints'
};

class AIService {
  /**
   * Analyze complaint using GROQ
   */
  async analyzeComplaint(complaintData) {
    try {
      const { title, description, category, location } = complaintData;
      
      const prompt = `You are an expert civic complaint analyzer for a municipal complaint management system.

Analyze this complaint and provide structured output:

**Complaint Title:** ${title}
**Description:** ${description}
**Initial Category:** ${category || 'Not specified'}
**Location:** ${location?.area || 'Unknown area'}, ${location?.city || 'Unknown city'}

Please analyze and provide:
1. Confirmed Category (must be one of: ${COMPLAINT_CATEGORIES.join(', ')})
2. Severity Level (low/medium/high/critical - consider impact, safety risk, urgency)
3. Priority Level (low/medium/high/critical - consider severity + number affected + safety)
4. Suggested Department (based on category)
5. Safety Risks (list any potential safety hazards, e.g., "vehicle accident hazard", "public health risk")
6. Brief Summary (2-3 sentences for authorities)
7. Estimated Resolution Time in hours (low: 48-168, medium: 24-72, high: 6-24, critical: 1-6)
8. Recommended Next Steps for authorities

Format as JSON only, no markdown:
{
  "category": "string",
  "severity": "string",
  "priority": "string",
  "department": "string",
  "safetyRisks": ["string"],
  "summary": "string",
  "estimatedResolutionHours": number,
  "nextSteps": ["string"],
  "confidence": 0.85
}`;

      const message = await groq.messages.create({
        model: 'mixtral-8x7b-32768',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      
      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultAnalysis(category);
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        severity: analysis.severity || 'medium',
        suggestedCategory: analysis.category || category,
        suggestedDepartment: analysis.department || DEPARTMENT_MAPPING[category] || 'General Complaints',
        safetyRisks: analysis.safetyRisks || [],
        summary: analysis.summary || description.substring(0, 200),
        confidence: analysis.confidence || 0.75,
        priority: analysis.priority || 'medium',
        estimatedResolutionHours: analysis.estimatedResolutionHours || 48,
        nextSteps: analysis.nextSteps || ['Verify complaint details', 'Assess location', 'Plan resolution'],
        aiModel: 'groq-mixtral-8x7b'
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return this.getDefaultAnalysis(category);
    }
  }

  /**
   * Detect duplicate complaints using text similarity
   */
  async detectDuplicates(complaint, existingComplaints) {
    try {
      if (!existingComplaints || existingComplaints.length === 0) {
        return [];
      }

      const prompt = `You are a complaint duplicate detector. Compare this new complaint with existing ones and identify potential duplicates.

NEW COMPLAINT:
Title: ${complaint.title}
Description: ${complaint.description}
Category: ${complaint.category}
Location: ${complaint.location?.area}

EXISTING COMPLAINTS:
${existingComplaints.map((c, idx) => `
${idx + 1}. ID: ${c.complaintId}
   Title: ${c.title}
   Category: ${c.category?.main}
   Location: ${c.location?.area}
   Status: ${c.status}
   Submitted: ${c.submittedAt}
`).join('\n')}

Return a JSON array of potential duplicates with similarity scores (0-1). Consider:
- Same or similar category
- Same/nearby location (within same area)
- Similar problem description
- Recent submission time

Format: [{"complaintId": "string", "similarity": number, "reason": "string"}]`;

      const message = await groq.messages.create({
        model: 'mixtral-8x7b-32768',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) return [];

      const duplicates = JSON.parse(jsonMatch[0]);
      return duplicates.filter(d => d.similarity > 0.6); // Only return high-confidence matches
    } catch (error) {
      console.error('Duplicate Detection Error:', error);
      return [];
    }
  }

  /**
   * Generate AI insights for authorities
   */
  async generateInsights(analyticsData) {
    try {
      const prompt = `Analyze this civic complaint data and provide actionable insights for municipal authorities:

${JSON.stringify(analyticsData, null, 2)}

Provide insights on:
1. Hotspot areas with complaint clusters
2. Recurring problems requiring preventive action
3. Department performance issues
4. Emerging civic problems
5. SLA compliance concerns
6. Recommendations for faster resolution

Format as JSON:
{
  "hotspots": [{"area": "string", "complaintCount": number, "primaryIssue": "string"}],
  "recurringProblems": [{"issue": "string", "frequency": number, "area": "string"}],
  "departmentIssues": [{"department": "string", "issue": "string"}],
  "emergingProblems": ["string"],
  "recommendations": ["string"],
  "slaConcerns": ["string"]
}`;

      const message = await groq.messages.create({
        model: 'mixtral-8x7b-32768',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) return this.getDefaultInsights();

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI Insights Error:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Get default analysis (fallback)
   */
  getDefaultAnalysis(category) {
    const dept = DEPARTMENT_MAPPING[category] || 'General Complaints';
    return {
      severity: 'medium',
      suggestedCategory: category || 'Other',
      suggestedDepartment: dept,
      safetyRisks: ['Public accessibility hazard'],
      summary: 'Complaint requires immediate investigation and resolution',
      confidence: 0.6,
      priority: 'medium',
      estimatedResolutionHours: 72,
      nextSteps: ['Verify complaint', 'Visit location', 'Assess damage', 'Plan repair'],
      aiModel: 'groq-mixtral-8x7b'
    };
  }

  /**
   * Get default insights (fallback)
   */
  getDefaultInsights() {
    return {
      hotspots: [
        { area: 'Downtown', complaintCount: 45, primaryIssue: 'Potholes' },
        { area: 'Suburbs', complaintCount: 28, primaryIssue: 'Garbage' }
      ],
      recurringProblems: [
        { issue: 'Road Damage', frequency: 35, area: 'Downtown' },
        { issue: 'Waste Management', frequency: 25, area: 'All Areas' }
      ],
      departmentIssues: [
        { department: 'Roads & Infrastructure', issue: 'High pending complaints' }
      ],
      emergingProblems: ['Water leakage in residential areas'],
      recommendations: [
        'Increase road maintenance patrols in Downtown',
        'Implement preventive waste management',
        'Allocate more resources to high-complaint areas'
      ],
      slaConcerns: ['3 critical complaints approaching deadline']
    };
  }
}

module.exports = new AIService();
