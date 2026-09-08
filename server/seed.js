require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, initDatabase } = require('./database');

async function seed() {
  initDatabase();
  const db = getDb();

  console.log('🌱 Seeding database...\n');

  // Clear existing data
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM sla_records;
    DELETE FROM notifications;
    DELETE FROM feedback;
    DELETE FROM complaint_upvotes;
    DELETE FROM complaint_comments;
    DELETE FROM complaint_status_history;
    DELETE FROM complaint_images;
    DELETE FROM complaints;
    DELETE FROM complaint_subcategories;
    DELETE FROM complaint_categories;
    DELETE FROM areas;
    DELETE FROM users;
    DELETE FROM departments;
    DELETE FROM sqlite_sequence;
  `);

  // Create departments
  const departments = [
    { name: 'Roads & Infrastructure', code: 'ROADS', description: 'Handles road repairs, potholes, and infrastructure', head_name: 'Rajesh Kumar', head_email: 'roads@civic.gov', sla_hours: 48 },
    { name: 'Sanitation & Waste', code: 'SANITATION', description: 'Garbage collection, waste management, and cleaning', head_name: 'Priya Sharma', head_email: 'sanitation@civic.gov', sla_hours: 24 },
    { name: 'Electrical Department', code: 'ELECTRICAL', description: 'Streetlights, power lines, and electrical infrastructure', head_name: 'Vikram Singh', head_email: 'electrical@civic.gov', sla_hours: 36 },
    { name: 'Water & Sewage', code: 'WATER', description: 'Water supply, leakage, drainage, and sewage', head_name: 'Anitha Devi', head_email: 'water@civic.gov', sla_hours: 24 },
    { name: 'Traffic & Transportation', code: 'TRAFFIC', description: 'Traffic signals, road signs, and traffic management', head_name: 'Mohammed Ali', head_email: 'traffic@civic.gov', sla_hours: 48 },
    { name: 'Parks & Recreation', code: 'PARKS', description: 'Public parks, gardens, and recreational spaces', head_name: 'Lakshmi Nair', head_email: 'parks@civic.gov', sla_hours: 72 },
    { name: 'Public Works', code: 'PUBLICWORKS', description: 'General public property and infrastructure', head_name: 'Suresh Babu', head_email: 'publicworks@civic.gov', sla_hours: 48 },
    { name: 'Environmental Services', code: 'ENVIRONMENT', description: 'Environmental protection and illegal dumping', head_name: 'Deepa Menon', head_email: 'environment@civic.gov', sla_hours: 48 }
  ];

  const insertDept = db.prepare('INSERT INTO departments (name, code, description, head_name, head_email, sla_hours) VALUES (?, ?, ?, ?, ?, ?)');
  departments.forEach(d => insertDept.run(d.name, d.code, d.description, d.head_name, d.head_email, d.sla_hours));
  console.log(`✅ ${departments.length} departments created`);

  // Create categories
  const categories = [
    { name: 'Pothole/Road Damage', code: 'POTHOLE', icon: '🕳️', dept: 1 },
    { name: 'Garbage/Waste', code: 'GARBAGE', icon: '🗑️', dept: 2 },
    { name: 'Streetlight', code: 'STREETLIGHT', icon: '💡', dept: 3 },
    { name: 'Water Leakage', code: 'WATER_LEAK', icon: '💧', dept: 4 },
    { name: 'Drainage/Sewage', code: 'DRAINAGE', icon: '🚰', dept: 4 },
    { name: 'Traffic/Safety', code: 'TRAFFIC', icon: '🚦', dept: 5 },
    { name: 'Public Property Damage', code: 'PROPERTY', icon: '🏛️', dept: 7 },
    { name: 'Electricity', code: 'ELECTRICITY', icon: '⚡', dept: 3 },
    { name: 'Parks/Public Spaces', code: 'PARKS', icon: '🌳', dept: 6 },
    { name: 'Illegal Dumping', code: 'DUMPING', icon: '🚮', dept: 8 },
    { name: 'Road Signs', code: 'ROAD_SIGNS', icon: '🚧', dept: 5 },
    { name: 'Other', code: 'OTHER', icon: '📋', dept: 7 }
  ];

  const insertCat = db.prepare('INSERT INTO complaint_categories (name, code, icon, department_id) VALUES (?, ?, ?, ?)');
  categories.forEach(c => insertCat.run(c.name, c.code, c.icon, c.dept));
  console.log(`✅ ${categories.length} categories created`);

  // Create subcategories
  const subcategories = [
    { cat: 1, name: 'Small Pothole', code: 'SMALL_POTHOLE' },
    { cat: 1, name: 'Large Pothole', code: 'LARGE_POTHOLE' },
    { cat: 1, name: 'Road Crack', code: 'ROAD_CRACK' },
    { cat: 1, name: 'Speed Bump Damage', code: 'SPEEDBUMP' },
    { cat: 2, name: 'Overflowing Bin', code: 'OVERFLOW_BIN' },
    { cat: 2, name: 'Street Litter', code: 'STREET_LITTER' },
    { cat: 2, name: 'Construction Debris', code: 'CONSTRUCTION_DEBRIS' },
    { cat: 3, name: 'Non-functional Light', code: 'NONFUNC_LIGHT' },
    { cat: 3, name: 'Flickering Light', code: 'FLICKER_LIGHT' },
    { cat: 3, name: 'Broken Pole', code: 'BROKEN_POLE' },
    { cat: 4, name: 'Pipe Burst', code: 'PIPE_BURST' },
    { cat: 4, name: 'Underground Leak', code: 'UNDERGROUND_LEAK' },
    { cat: 5, name: 'Blocked Drain', code: 'BLOCKED_DRAIN' },
    { cat: 5, name: 'Overflowing Sewage', code: 'OVERFLOW_SEWAGE' },
    { cat: 6, name: 'Broken Signal', code: 'BROKEN_SIGNAL' },
    { cat: 6, name: 'Missing Sign', code: 'MISSING_SIGN' }
  ];

  const insertSubcat = db.prepare('INSERT INTO complaint_subcategories (category_id, name, code) VALUES (?, ?, ?)');
  subcategories.forEach(s => insertSubcat.run(s.cat, s.name, s.code));
  console.log(`✅ ${subcategories.length} subcategories created`);

  // Create areas
  const areas = [
    { name: 'Anna Nagar', city: 'Chennai', zone: 'Zone 8', lat: 13.0850, lng: 80.2101 },
    { name: 'T. Nagar', city: 'Chennai', zone: 'Zone 10', lat: 13.0418, lng: 80.2341 },
    { name: 'Adyar', city: 'Chennai', zone: 'Zone 13', lat: 13.0063, lng: 80.2574 },
    { name: 'Mylapore', city: 'Chennai', zone: 'Zone 9', lat: 13.0336, lng: 80.2676 },
    { name: 'Velachery', city: 'Chennai', zone: 'Zone 14', lat: 12.9815, lng: 80.2180 },
    { name: 'Guindy', city: 'Chennai', zone: 'Zone 12', lat: 13.0067, lng: 80.2206 },
    { name: 'Tambaram', city: 'Chennai', zone: 'Zone 15', lat: 12.9249, lng: 80.1000 },
    { name: 'Porur', city: 'Chennai', zone: 'Zone 11', lat: 13.0382, lng: 80.1564 }
  ];

  const insertArea = db.prepare('INSERT INTO areas (name, city, zone, latitude, longitude) VALUES (?, ?, ?, ?, ?)');
  areas.forEach(a => insertArea.run(a.name, a.city, a.zone, a.lat, a.lng));
  console.log(`✅ ${areas.length} areas created`);

  // Create users
  const hashedPassword = bcrypt.hashSync('password123', 10);

  const users = [
    { name: 'Admin User', email: 'admin@civicconnect.gov', phone: '9000000001', role: 'admin', city: 'Chennai', area: 'Anna Nagar', dept: null },
    { name: 'Rajesh Kumar', email: 'rajesh@roads.gov', phone: '9000000002', role: 'authority', city: 'Chennai', area: 'Anna Nagar', dept: 1 },
    { name: 'Priya Sharma', email: 'priya@sanitation.gov', phone: '9000000003', role: 'authority', city: 'Chennai', area: 'T. Nagar', dept: 2 },
    { name: 'Vikram Singh', email: 'vikram@electrical.gov', phone: '9000000004', role: 'authority', city: 'Chennai', area: 'Adyar', dept: 3 },
    { name: 'Anitha Devi', email: 'anitha@water.gov', phone: '9000000005', role: 'authority', city: 'Chennai', area: 'Mylapore', dept: 4 },
    { name: 'Mohammed Ali', email: 'mohammed@traffic.gov', phone: '9000000006', role: 'authority', city: 'Chennai', area: 'Velachery', dept: 5 },
    { name: 'Lakshmi Nair', email: 'lakshmi@parks.gov', phone: '9000000007', role: 'authority', city: 'Chennai', area: 'Guindy', dept: 6 },
    { name: 'Arun Prakash', email: 'arun@citizen.com', phone: '9100000001', role: 'citizen', city: 'Chennai', area: 'Anna Nagar', dept: null },
    { name: 'Meena Kumari', email: 'meena@citizen.com', phone: '9100000002', role: 'citizen', city: 'Chennai', area: 'T. Nagar', dept: null },
    { name: 'Karthik Raja', email: 'karthik@citizen.com', phone: '9100000003', role: 'citizen', city: 'Chennai', area: 'Adyar', dept: null },
    { name: 'Divya Rajan', email: 'divya@citizen.com', phone: '9100000004', role: 'citizen', city: 'Chennai', area: 'Velachery', dept: null },
    { name: 'Sanjay Gupta', email: 'sanjay@citizen.com', phone: '9100000005', role: 'citizen', city: 'Chennai', area: 'Mylapore', dept: null },
    { name: 'Fatima Begum', email: 'fatima@citizen.com', phone: '9100000006', role: 'citizen', city: 'Chennai', area: 'Guindy', dept: null }
  ];

  const insertUser = db.prepare('INSERT INTO users (full_name, email, phone, password, role, city, area, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  users.forEach(u => insertUser.run(u.name, u.email, u.phone, hashedPassword, u.role, u.city, u.area, u.dept));
  console.log(`✅ ${users.length} users created`);

  // Create sample complaints
  const sampleComplaints = [
    { uid: 8, title: 'Large pothole on main road', desc: 'There is a dangerous large pothole on the main road near Anna Nagar signal junction. Multiple vehicles have been damaged. Urgent repair needed.', cat: 1, subcat: 2, lat: 13.0855, lng: 80.2107, addr: '2nd Avenue, Anna Nagar', landmark: 'Near Anna Nagar Signal Junction', city: 'Chennai', area: 'Anna Nagar', status: 'in_progress', priority: 'high', severity: 8, dept: 1, officer: 2 },
    { uid: 8, title: 'Garbage overflowing near park', desc: 'The garbage bins near the park entrance are overflowing for the past 3 days. Bad smell and health hazard for nearby residents.', cat: 2, subcat: 5, lat: 13.0862, lng: 80.2115, addr: 'Tower Park Road, Anna Nagar', landmark: 'Near Anna Nagar Tower Park', city: 'Chennai', area: 'Anna Nagar', status: 'assigned', priority: 'medium', severity: 6, dept: 2, officer: 3 },
    { uid: 9, title: 'Streetlight not working', desc: 'The streetlight on South Usman Road has been non-functional for over a week. The area becomes very dark at night creating safety concerns.', cat: 3, subcat: 8, lat: 13.0420, lng: 80.2345, addr: 'South Usman Road, T. Nagar', landmark: 'Near Panagal Park', city: 'Chennai', area: 'T. Nagar', status: 'resolved', priority: 'medium', severity: 5, dept: 3, officer: 4 },
    { uid: 9, title: 'Water pipe burst on main road', desc: 'A water pipe has burst on the main road causing flooding. Water has been wasting for hours. Immediate repair required.', cat: 4, subcat: 11, lat: 13.0425, lng: 80.2350, addr: 'GN Chetty Road, T. Nagar', landmark: 'Near T. Nagar Bus Stop', city: 'Chennai', area: 'T. Nagar', status: 'submitted', priority: 'critical', severity: 9, dept: 4, officer: null },
    { uid: 10, title: 'Blocked drainage causing flooding', desc: 'The drainage near Adyar bridge is completely blocked causing waterlogging during even light rain. Multiple houses affected.', cat: 5, subcat: 13, lat: 13.0068, lng: 80.2580, addr: 'Lattice Bridge Road, Adyar', landmark: 'Near Adyar Bridge', city: 'Chennai', area: 'Adyar', status: 'under_review', priority: 'high', severity: 7, dept: 4, officer: 5 },
    { uid: 10, title: 'Broken traffic signal', desc: 'The traffic signal at Adyar junction is malfunctioning since yesterday. Cars are not stopping causing near-accidents frequently.', cat: 6, subcat: 15, lat: 13.0070, lng: 80.2575, addr: 'Adyar Junction', landmark: 'Adyar Signal', city: 'Chennai', area: 'Adyar', status: 'in_progress', priority: 'critical', severity: 9, dept: 5, officer: 6 },
    { uid: 11, title: 'Damaged park bench and fence', desc: 'Several benches and the boundary fence in Velachery Park are broken. Children playing in the area might get hurt.', cat: 9, subcat: null, lat: 12.9820, lng: 80.2185, addr: 'Velachery Main Road', landmark: 'Near Velachery Park', city: 'Chennai', area: 'Velachery', status: 'assigned', priority: 'low', severity: 3, dept: 6, officer: 7 },
    { uid: 11, title: 'Illegal waste dumping site', desc: 'Someone has been dumping construction waste illegally near the residential area. It is growing bigger each day and attracting pests.', cat: 10, subcat: null, lat: 12.9825, lng: 80.2190, addr: 'MMDA Colony, Velachery', landmark: 'Near MMDA Park', city: 'Chennai', area: 'Velachery', status: 'ai_analyzed', priority: 'high', severity: 7, dept: 8, officer: null },
    { uid: 12, title: 'Road sign missing at intersection', desc: 'The stop sign at the intersection near Mylapore temple was knocked down by a vehicle last week. Still not replaced.', cat: 11, subcat: 16, lat: 13.0340, lng: 80.2680, addr: 'Kutchery Road, Mylapore', landmark: 'Near Kapaleeswarar Temple', city: 'Chennai', area: 'Mylapore', status: 'submitted', priority: 'medium', severity: 5, dept: 5, officer: null },
    { uid: 12, title: 'Exposed electrical wires on pole', desc: 'Dangerous exposed wires hanging from an electricity pole. A serious safety hazard especially during rain. Children play nearby.', cat: 8, subcat: null, lat: 13.0345, lng: 80.2685, addr: 'Luz Corner, Mylapore', landmark: 'Near Luz Church', city: 'Chennai', area: 'Mylapore', status: 'in_progress', priority: 'critical', severity: 10, dept: 3, officer: 4 },
    { uid: 13, title: 'Pothole cluster on IT corridor', desc: 'Multiple potholes have formed on the road near Guindy industrial estate. Commuters face daily difficulties.', cat: 1, subcat: 1, lat: 13.0072, lng: 80.2210, addr: 'Mount Poonamallee Road, Guindy', landmark: 'Near Guindy Estate', city: 'Chennai', area: 'Guindy', status: 'resolved', priority: 'high', severity: 7, dept: 1, officer: 2 },
    { uid: 13, title: 'Sewage overflow on residential street', desc: 'Sewage is overflowing from a manhole near residential area. Foul smell and unsanitary conditions. Health risk for residents.', cat: 5, subcat: 14, lat: 13.0075, lng: 80.2215, addr: 'Kathipara Junction, Guindy', landmark: 'Near Kathipara', city: 'Chennai', area: 'Guindy', status: 'assigned', priority: 'high', severity: 8, dept: 4, officer: 5 },
    { uid: 8, title: 'Broken footpath tiles', desc: 'The footpath tiles along 3rd Avenue are broken and uneven. Senior citizens and children find it difficult to walk safely.', cat: 7, subcat: null, lat: 13.0860, lng: 80.2110, addr: '3rd Avenue, Anna Nagar', landmark: 'Near Anna Nagar Roundabout', city: 'Chennai', area: 'Anna Nagar', status: 'submitted', priority: 'medium', severity: 4, dept: 7, officer: null },
    { uid: 9, title: 'Water supply contamination', desc: 'The drinking water supplied to our area has a yellowish color and foul smell. Multiple residents have reported stomach issues.', cat: 4, subcat: null, lat: 13.0430, lng: 80.2355, addr: 'Bazullah Road, T. Nagar', landmark: 'Near Sri Devi Theatre', city: 'Chennai', area: 'T. Nagar', status: 'under_review', priority: 'critical', severity: 9, dept: 4, officer: 5 },
    { uid: 10, title: 'Abandoned vehicle blocking road', desc: 'An abandoned vehicle has been parked on the main road for weeks blocking half the road. Traffic congestion daily.', cat: 6, subcat: null, lat: 13.0065, lng: 80.2570, addr: 'Gandhi Nagar, Adyar', landmark: 'Near IIT Gate', city: 'Chennai', area: 'Adyar', status: 'resolved', priority: 'low', severity: 3, dept: 5, officer: 6 },
    { uid: 11, title: 'Mosquito breeding in stagnant water', desc: 'There is stagnant water collected near the vacant plot. Mosquito breeding has increased causing dengue risk to the entire area.', cat: 10, subcat: null, lat: 12.9830, lng: 80.2195, addr: 'AGS Colony, Velachery', landmark: 'Near Velachery Lake', city: 'Chennai', area: 'Velachery', status: 'in_progress', priority: 'high', severity: 8, dept: 2, officer: 3 },
    { uid: 12, title: 'Fallen tree blocking pathway', desc: 'A large tree fell during last night storm blocking the entire walkway. Branches are scattered on the road too.', cat: 9, subcat: null, lat: 13.0350, lng: 80.2690, addr: 'CP Ramaswami Road, Mylapore', landmark: 'Near Mandaveli Railway Station', city: 'Chennai', area: 'Mylapore', status: 'resolved', priority: 'high', severity: 6, dept: 6, officer: 7 },
    { uid: 13, title: 'Noise pollution from construction', desc: 'Construction work happening at night near residential area causing severe noise pollution. Violating noise regulations.', cat: 12, subcat: null, lat: 13.0078, lng: 80.2220, addr: 'SIDCO Industrial Estate, Guindy', landmark: 'Near Guindy Metro Station', city: 'Chennai', area: 'Guindy', status: 'submitted', priority: 'low', severity: 4, dept: 8, officer: null },
    { uid: 8, title: 'Damaged storm water drain cover', desc: 'The iron cover of the storm water drain is broken and partially open. Pedestrians and vehicles are at risk of accidents.', cat: 5, subcat: null, lat: 13.0858, lng: 80.2113, addr: '18th Main Road, Anna Nagar', landmark: 'Near Chinmaya Nagar', city: 'Chennai', area: 'Anna Nagar', status: 'ai_analyzed', priority: 'high', severity: 8, dept: 4, officer: null },
    { uid: 9, title: 'Overhanging tree branches on power lines', desc: 'Large tree branches are resting on power lines near the school. Sparking has been noticed during windy conditions.', cat: 8, subcat: null, lat: 13.0435, lng: 80.2360, addr: 'Nandanam Main Road, T. Nagar', landmark: 'Near Nandanam School', city: 'Chennai', area: 'T. Nagar', status: 'assigned', priority: 'critical', severity: 9, dept: 3, officer: 4 },
    { uid: 10, title: 'Broken water meter', desc: 'My area water meter has been broken for weeks. Unable to track consumption, and there seems to be a leak at the meter point.', cat: 4, subcat: null, lat: 13.0062, lng: 80.2565, addr: 'Thiruvanmiyur Main Road', landmark: 'Near Adyar Bakery', city: 'Chennai', area: 'Adyar', status: 'closed', priority: 'low', severity: 2, dept: 4, officer: 5 },
    { uid: 11, title: 'Missing manhole cover', desc: 'A manhole cover is missing on the busy road. Covered temporarily with wood by locals but very dangerous especially at night.', cat: 7, subcat: null, lat: 12.9835, lng: 80.2200, addr: '100 Feet Road, Velachery', landmark: 'Near Velachery Bus Depot', city: 'Chennai', area: 'Velachery', status: 'in_progress', priority: 'critical', severity: 10, dept: 7, officer: null },
    { uid: 13, title: 'Flickering streetlights on highway', desc: 'Multiple streetlights on the inner ring road near Guindy are flickering creating visibility issues for drivers at night.', cat: 3, subcat: 9, lat: 13.0080, lng: 80.2225, addr: 'Inner Ring Road, Guindy', landmark: 'Near Guindy Race Course', city: 'Chennai', area: 'Guindy', status: 'submitted', priority: 'medium', severity: 5, dept: 3, officer: null }
  ];

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (complaint_id, user_id, title, description, category_id, subcategory_id, latitude, longitude, address, landmark, city, area, status, priority, severity, department_id, assigned_officer_id, ai_category, ai_severity, ai_priority, ai_summary, ai_department, ai_safety_risk, ai_resolution_time, ai_confidence, created_at, updated_at, sla_deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStatusHistory = db.prepare('INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const insertNotification = db.prepare('INSERT INTO notifications (user_id, title, message, type, complaint_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');

  const aiCategories = { 1: 'Road Damage', 2: 'Waste Management', 3: 'Street Lighting', 4: 'Water Infrastructure', 5: 'Drainage System', 6: 'Traffic Management', 7: 'Public Property', 8: 'Electrical Infrastructure', 9: 'Parks & Recreation', 10: 'Environmental Hazard', 11: 'Traffic Signage', 12: 'General Civic Issue' };
  const aiDepts = { 1: 'Roads & Infrastructure', 2: 'Sanitation & Waste', 3: 'Electrical Department', 4: 'Water & Sewage', 5: 'Traffic & Transportation', 6: 'Parks & Recreation', 7: 'Public Works', 8: 'Environmental Services' };
  const safetyRisks = ['Vehicle/Accident Hazard', 'Health Hazard', 'Electrical Hazard', 'Pedestrian Safety Risk', 'Flooding Risk', 'Child Safety Risk', 'Low Risk', 'Environmental Hazard'];

  const now = new Date();
  sampleComplaints.forEach((c, i) => {
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const created = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const slaHours = c.priority === 'critical' ? 12 : c.priority === 'high' ? 24 : c.priority === 'medium' ? 48 : 72;
    const slaDeadline = new Date(created.getTime() + slaHours * 60 * 60 * 1000);
    const complaintId = `CC-${String(2025)}-${String(i + 1).padStart(5, '0')}`;

    const riskIndex = Math.min(Math.floor(c.severity / 1.5), safetyRisks.length - 1);

    insertComplaint.run(
      complaintId, c.uid, c.title, c.desc, c.cat, c.subcat,
      c.lat, c.lng, c.addr, c.landmark, c.city, c.area,
      c.status, c.priority, c.severity, c.dept, c.officer,
      aiCategories[c.cat] || 'General', c.severity > 7 ? 'High' : c.severity > 4 ? 'Medium' : 'Low',
      c.priority, c.desc.substring(0, 100) + '...', aiDepts[c.dept] || 'Public Works',
      safetyRisks[riskIndex], slaHours <= 24 ? '24-48 hours' : '3-5 days',
      0.85 + Math.random() * 0.12,
      created.toISOString(), created.toISOString(), slaDeadline.toISOString()
    );

    // Add status history
    insertStatusHistory.run(i + 1, null, 'submitted', c.uid, 'Complaint submitted by citizen', created.toISOString());
    if (['ai_analyzed', 'assigned', 'under_review', 'in_progress', 'resolved', 'closed'].includes(c.status)) {
      insertStatusHistory.run(i + 1, 'submitted', 'ai_analyzed', null, 'AI analysis completed', new Date(created.getTime() + 300000).toISOString());
    }
    if (['assigned', 'under_review', 'in_progress', 'resolved', 'closed'].includes(c.status)) {
      insertStatusHistory.run(i + 1, 'ai_analyzed', 'assigned', 1, `Assigned to ${aiDepts[c.dept]}`, new Date(created.getTime() + 3600000).toISOString());
    }
    if (['under_review', 'in_progress', 'resolved', 'closed'].includes(c.status)) {
      insertStatusHistory.run(i + 1, 'assigned', 'under_review', c.officer, 'Complaint under review by officer', new Date(created.getTime() + 7200000).toISOString());
    }
    if (['in_progress', 'resolved', 'closed'].includes(c.status)) {
      insertStatusHistory.run(i + 1, 'under_review', 'in_progress', c.officer, 'Work has started on this issue', new Date(created.getTime() + 14400000).toISOString());
    }
    if (['resolved', 'closed'].includes(c.status)) {
      insertStatusHistory.run(i + 1, 'in_progress', 'resolved', c.officer, 'Issue has been resolved', new Date(created.getTime() + 86400000).toISOString());
    }
    if (c.status === 'closed') {
      insertStatusHistory.run(i + 1, 'resolved', 'closed', c.uid, 'Complaint verified and closed', new Date(created.getTime() + 172800000).toISOString());
    }

    // Add notification
    insertNotification.run(c.uid, 'Complaint Submitted', `Your complaint "${c.title}" has been submitted successfully. Complaint ID: ${complaintId}`, 'success', i + 1, created.toISOString());
  });

  console.log(`✅ ${sampleComplaints.length} complaints created with status history`);

  // Add feedback for resolved/closed complaints
  const feedbackData = [
    { complaint: 3, user: 9, rating: 4, satisfaction: 'satisfied', comment: 'Streetlight fixed promptly. Good work!', resolved: 1 },
    { complaint: 11, user: 13, rating: 5, satisfaction: 'very_satisfied', comment: 'All potholes filled properly. Excellent response time.', resolved: 1 },
    { complaint: 15, user: 10, rating: 3, satisfaction: 'neutral', comment: 'Vehicle removed but took too long.', resolved: 1 },
    { complaint: 17, user: 12, rating: 5, satisfaction: 'very_satisfied', comment: 'Tree cleared quickly after complaint. Thank you!', resolved: 1 },
    { complaint: 21, user: 10, rating: 4, satisfaction: 'satisfied', comment: 'Water meter replaced and leak fixed.', resolved: 1 }
  ];

  const insertFeedback = db.prepare('INSERT INTO feedback (complaint_id, user_id, rating, satisfaction, comment, is_resolved) VALUES (?, ?, ?, ?, ?, ?)');
  feedbackData.forEach(f => insertFeedback.run(f.complaint, f.user, f.rating, f.satisfaction, f.comment, f.resolved));
  console.log(`✅ ${feedbackData.length} feedback entries created`);

  // Add some comments
  const comments = [
    { complaint: 1, user: 2, comment: 'Road repair crew dispatched. Expected completion in 2 days.', internal: 0 },
    { complaint: 1, user: 8, comment: 'Thank you for the quick response!', internal: 0 },
    { complaint: 2, user: 3, comment: 'Sanitation team has been notified. Will clean up by tomorrow.', internal: 0 },
    { complaint: 5, user: 5, comment: 'Drainage team is assessing the blockage. May require heavy equipment.', internal: 0 },
    { complaint: 6, user: 6, comment: 'Traffic signal repair team on site. New signal being installed.', internal: 0 },
    { complaint: 10, user: 4, comment: 'URGENT: Electrical team dispatched immediately. Area cordoned off for safety.', internal: 0 },
    { complaint: 10, user: 1, comment: 'Internal note: This is a critical safety issue. Ensure resolution within 6 hours.', internal: 1 }
  ];

  const insertComment = db.prepare('INSERT INTO complaint_comments (complaint_id, user_id, comment, is_internal) VALUES (?, ?, ?, ?)');
  comments.forEach(c => insertComment.run(c.complaint, c.user, c.comment, c.internal));
  console.log(`✅ ${comments.length} comments created`);

  // Add upvotes
  const upvotes = [
    { complaint: 1, user: 9 }, { complaint: 1, user: 10 }, { complaint: 1, user: 11 },
    { complaint: 4, user: 8 }, { complaint: 4, user: 10 }, { complaint: 4, user: 11 }, { complaint: 4, user: 12 },
    { complaint: 6, user: 8 }, { complaint: 6, user: 9 },
    { complaint: 10, user: 8 }, { complaint: 10, user: 9 }, { complaint: 10, user: 11 }, { complaint: 10, user: 13 },
    { complaint: 14, user: 8 }, { complaint: 14, user: 10 }, { complaint: 14, user: 11 },
    { complaint: 22, user: 8 }, { complaint: 22, user: 9 }, { complaint: 22, user: 10 }
  ];

  const insertUpvote = db.prepare('INSERT OR IGNORE INTO complaint_upvotes (complaint_id, user_id) VALUES (?, ?)');
  const updateUpvoteCount = db.prepare('UPDATE complaints SET upvote_count = (SELECT COUNT(*) + 1 FROM complaint_upvotes WHERE complaint_id = ?) WHERE id = ?');
  upvotes.forEach(u => {
    insertUpvote.run(u.complaint, u.user);
    updateUpvoteCount.run(u.complaint, u.complaint);
  });
  console.log(`✅ ${upvotes.length} upvotes created`);

  // Audit logs
  const insertAudit = db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?)');
  insertAudit.run(1, 'SYSTEM_INIT', 'system', null, 'Database seeded with demo data');
  insertAudit.run(1, 'USER_CREATE', 'user', 1, 'Admin user created');
  console.log('✅ Audit logs created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Demo Login Credentials:');
  console.log('─────────────────────────────────────');
  console.log('  Admin:     admin@civicconnect.gov / password123');
  console.log('  Authority: rajesh@roads.gov / password123');
  console.log('  Citizen:   arun@citizen.com / password123');
  console.log('─────────────────────────────────────\n');
}

seed().catch(console.error);

