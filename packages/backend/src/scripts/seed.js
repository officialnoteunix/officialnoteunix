import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/noteunix';

const { Schema, model } = mongoose;

// ─── Inline Schemas ───
const userSchema = new Schema({
  fullname: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: '' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  avatar: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  suspendedUntil: { type: Date, default: null },
  refreshTokenHash: { type: String, default: null },
  refreshTokenPrefix: { type: String, default: null },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, default: null },
  emailVerifyExpiry: { type: Date, default: null },
}, { timestamps: true });

const universitySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  logo: { type: String, default: null },
  description: { type: String, default: '' },
}, { timestamps: true });

const courseSchema = new Schema({
  universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true },
  description: { type: String, default: '' },
}, { timestamps: true });
courseSchema.index({ universityId: 1, slug: 1 }, { unique: true });

const semesterSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  semesterNumber: { type: Number },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
}, { timestamps: true });
semesterSchema.index({ courseId: 1, semesterNumber: 1 }, { unique: true });

const subjectSchema = new Schema({
  semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, default: '' },
  slug: { type: String, required: true, lowercase: true },
  description: { type: String, default: '' },
}, { timestamps: true });
subjectSchema.index({ semesterId: 1, slug: 1 }, { unique: true });

const User = model('User', userSchema);
const University = model('University', universitySchema);
const Course = model('Course', courseSchema);
const Semester = model('Semester', semesterSchema);
const Subject = model('Subject', subjectSchema);

const hash = (pw) => bcrypt.hash(pw, 12);

// ─── FWU Data ───
const fwu = {
  name: 'Far Western University',
  slug: 'far-western-university',
  description: 'Established in 2010 by Act of Parliament of Nepal. Government-funded university located in Bhimdatta, Kanchanpur. Offers programs across 6 faculties: Management, Science & Technology, Engineering, Education, Humanities & Social Sciences, and Agriculture.',
};

const courses = [
  {
    name: 'Bachelor of Science in Computer Science and Information Technology',
    slug: 'bsc-csit',
    description: '4-year, 8-semester undergraduate program covering programming, databases, networking, AI, and software engineering.',
    semesters: [
      {
        semesterNumber: 1, title: 'Semester 1',
        subjects: [
          { name: 'C Programming', code: 'CS101', slug: 'cs101-c-programming', description: 'Programming fundamentals using the C language, data types, control structures, functions, and arrays.' },
          { name: 'Digital Logic', code: 'CS102', slug: 'cs102-digital-logic', description: 'Boolean algebra, logic gates, combinational and sequential circuits, and digital system design.' },
          { name: 'Mathematics I', code: 'MATH101', slug: 'math101-math-i', description: 'Calculus, analytic geometry, and introduction to linear algebra.' },
          { name: 'Physics I', code: 'PHY101', slug: 'phy101-physics-i', description: 'Mechanics, properties of matter, heat, sound, and wave motion.' },
          { name: 'English I', code: 'ENG101', slug: 'eng101-english-i', description: 'Academic writing, reading comprehension, and communication skills.' },
        ],
      },
      {
        semesterNumber: 2, title: 'Semester 2',
        subjects: [
          { name: 'Object Oriented Programming', code: 'CS201', slug: 'cs201-oop', description: 'OOP concepts, classes, inheritance, polymorphism, and exception handling using Java or C++.' },
          { name: 'Data Structures', code: 'CS202', slug: 'cs202-data-structures', description: 'Arrays, linked lists, stacks, queues, trees, graphs, sorting and searching algorithms.' },
          { name: 'Mathematics II', code: 'MATH102', slug: 'math102-math-ii', description: 'Linear algebra, differential equations, and numerical methods.' },
          { name: 'Physics II', code: 'PHY102', slug: 'phy102-physics-ii', description: 'Electricity, magnetism, optics, and modern physics.' },
          { name: 'English II', code: 'ENG102', slug: 'eng102-english-ii', description: 'Technical writing, presentation skills, and literature appreciation.' },
        ],
      },
      {
        semesterNumber: 3, title: 'Semester 3',
        subjects: [
          { name: 'Algorithm Analysis', code: 'CS301', slug: 'cs301-algorithm-analysis', description: 'Algorithm design paradigms, complexity analysis, divide and conquer, greedy, and dynamic programming.' },
          { name: 'Computer Architecture', code: 'CS302', slug: 'cs302-computer-architecture', description: 'CPU design, memory hierarchy, I/O systems, RISC vs CISC, and pipeline processing.' },
          { name: 'Discrete Mathematics', code: 'MATH201', slug: 'math201-discrete-math', description: 'Set theory, combinatorics, graph theory, logic, and proof techniques.' },
          { name: 'Statistics', code: 'STAT201', slug: 'stat201-statistics', description: 'Probability distributions, hypothesis testing, regression analysis, and statistical inference.' },
          { name: 'Microprocessor', code: 'CS303', slug: 'cs303-microprocessor', description: '8085/8086 architecture, assembly language programming, and interfacing.' },
        ],
      },
      {
        semesterNumber: 4, title: 'Semester 4',
        subjects: [
          { name: 'Operating Systems', code: 'CS401', slug: 'cs401-operating-systems', description: 'Process management, memory management, file systems, CPU scheduling, and deadlocks.' },
          { name: 'Database Management Systems', code: 'CS402', slug: 'cs402-dbms', description: 'Relational model, SQL, normalization, transactions, and database design.' },
          { name: 'Theory of Computation', code: 'CS403', slug: 'cs403-theory-of-computation', description: 'Finite automata, regular languages, context-free grammars, Turing machines, and computability.' },
          { name: 'Numerical Methods', code: 'MATH202', slug: 'math202-numerical-methods', description: 'Root finding, interpolation, numerical integration, and solution of differential equations.' },
          { name: 'Computer Networks', code: 'CS404', slug: 'cs404-computer-networks', description: 'OSI model, TCP/IP, routing, switching, and network security fundamentals.' },
        ],
      },
      {
        semesterNumber: 5, title: 'Semester 5',
        subjects: [
          { name: 'Web Technologies', code: 'CS501', slug: 'cs501-web-technologies', description: 'HTML, CSS, JavaScript, responsive design, and modern web frameworks.' },
          { name: 'Software Engineering', code: 'CS502', slug: 'cs502-software-engineering', description: 'SDLC models, requirements engineering, design patterns, testing, and project management.' },
          { name: 'Artificial Intelligence', code: 'CS503', slug: 'cs503-artificial-intelligence', description: 'Search algorithms, knowledge representation, machine learning basics, and expert systems.' },
          { name: 'System Analysis and Design', code: 'CS504', slug: 'cs504-system-analysis', description: 'System development lifecycle, UML modeling, requirements gathering, and feasibility analysis.' },
        ],
      },
      {
        semesterNumber: 6, title: 'Semester 6',
        subjects: [
          { name: 'Machine Learning', code: 'CS601', slug: 'cs601-machine-learning', description: 'Supervised and unsupervised learning, neural networks, decision trees, and evaluation metrics.' },
          { name: 'Network Programming', code: 'CS602', slug: 'cs602-network-programming', description: 'Socket programming, client-server architecture, HTTP protocol, and RESTful APIs.' },
          { name: 'Compiler Design', code: 'CS603', slug: 'cs603-compiler-design', description: 'Lexical analysis, parsing, syntax-directed translation, code generation, and optimization.' },
          { name: 'Cyber Security', code: 'CS604', slug: 'cs604-cyber-security', description: 'Cryptography, network security, penetration testing, and security protocols.' },
        ],
      },
      {
        semesterNumber: 7, title: 'Semester 7',
        subjects: [
          { name: 'Cloud Computing', code: 'CS701', slug: 'cs701-cloud-computing', description: 'Cloud architectures, virtualization, AWS/Azure services, and deployment models.' },
          { name: 'Data Science', code: 'CS702', slug: 'cs702-data-science', description: 'Data mining, visualization, big data tools, and predictive analytics.' },
          { name: 'Mobile Application Development', code: 'CS703', slug: 'cs703-mobile-development', description: 'Cross-platform mobile app development using React Native or Flutter.' },
          { name: 'Technical Writing', code: 'ENG301', slug: 'eng301-technical-writing', description: 'Research papers, technical documentation, and proposal writing.' },
        ],
      },
      {
        semesterNumber: 8, title: 'Semester 8',
        subjects: [
          { name: 'DevOps and Agile', code: 'CS801', slug: 'cs801-devops-agile', description: 'CI/CD pipelines, containerization, Docker, Kubernetes, and agile methodologies.' },
          { name: 'Blockchain Technology', code: 'CS802', slug: 'cs802-blockchain', description: 'Distributed ledger, smart contracts, Ethereum, and decentralized applications.' },
          { name: 'Project Work', code: 'CS899', slug: 'cs899-project-work', description: 'Capstone project applying software engineering principles to a real-world problem.' },
        ],
      },
    ],
  },
  {
    name: 'Bachelor in Information Technology',
    slug: 'bit',
    description: '4-year, 8-semester undergraduate program focusing on IT infrastructure, databases, networking, and web technologies.',
    semesters: [
      {
        semesterNumber: 1, title: 'Semester 1',
        subjects: [
          { name: 'Introduction to Information Technology', code: 'IT101', slug: 'it101-intro-it', description: 'Fundamentals of computer systems, hardware, software, and the internet.' },
          { name: 'C Programming', code: 'IT102', slug: 'it102-c-programming', description: 'Programming fundamentals using the C language.' },
          { name: 'Mathematics I', code: 'MT101', slug: 'mt101-math-i', description: 'Calculus, analytic geometry, and linear algebra.' },
          { name: 'Physics', code: 'PH101', slug: 'ph101-physics', description: 'Mechanics, properties of matter, and thermodynamics.' },
          { name: 'English I', code: 'EN101', slug: 'en101-english-i', description: 'Academic writing and communication skills.' },
        ],
      },
      {
        semesterNumber: 2, title: 'Semester 2',
        subjects: [
          { name: 'Data Structures', code: 'IT201', slug: 'it201-data-structures', description: 'Arrays, linked lists, stacks, queues, trees, and graphs.' },
          { name: 'Object Oriented Programming', code: 'IT202', slug: 'it202-oop', description: 'OOP concepts using Java or C++.' },
          { name: 'Mathematics II', code: 'MT102', slug: 'mt102-math-ii', description: 'Differential equations and numerical methods.' },
          { name: 'Digital Electronics', code: 'IT203', slug: 'it203-digital-electronics', description: 'Logic gates, Boolean algebra, and digital circuits.' },
          { name: 'English II', code: 'EN102', slug: 'en102-english-ii', description: 'Technical writing and presentation skills.' },
        ],
      },
      {
        semesterNumber: 3, title: 'Semester 3',
        subjects: [
          { name: 'Database Management Systems', code: 'IT301', slug: 'it301-dbms', description: 'Relational databases, SQL, normalization, and transactions.' },
          { name: 'Computer Networks', code: 'IT302', slug: 'it302-networks', description: 'OSI model, TCP/IP, routing, and network security.' },
          { name: 'Operating Systems', code: 'IT303', slug: 'it303-os', description: 'Process management, memory management, and file systems.' },
          { name: 'Statistics', code: 'MT201', slug: 'mt201-statistics', description: 'Probability, distributions, hypothesis testing, and regression.' },
          { name: 'Microprocessor', code: 'IT304', slug: 'it304-microprocessor', description: '8085/8086 architecture and assembly language programming.' },
        ],
      },
      {
        semesterNumber: 4, title: 'Semester 4',
        subjects: [
          { name: 'Web Development', code: 'IT401', slug: 'it401-web-development', description: 'HTML, CSS, JavaScript, and responsive web design.' },
          { name: 'Software Engineering', code: 'IT402', slug: 'it402-software-engineering', description: 'SDLC, design patterns, testing, and project management.' },
          { name: 'Data Communication', code: 'IT403', slug: 'it403-data-communication', description: 'Transmission media, protocols, switching, and multiplexing.' },
          { name: 'Discrete Mathematics', code: 'MT202', slug: 'mt202-discrete-math', description: 'Set theory, graph theory, and combinatorics.' },
        ],
      },
      {
        semesterNumber: 5, title: 'Semester 5',
        subjects: [
          { name: 'Web Programming', code: 'IT501', slug: 'it501-web-programming', description: 'Server-side programming, PHP, Node.js, and APIs.' },
          { name: 'Network Administration', code: 'IT502', slug: 'it502-network-admin', description: 'Linux server administration, DNS, DHCP, and firewall management.' },
          { name: 'System Analysis and Design', code: 'IT503', slug: 'it503-system-analysis', description: 'UML modeling, requirements engineering, and system design.' },
          { name: 'Database Administration', code: 'IT504', slug: 'it504-db-admin', description: 'Database administration, backup, recovery, and performance tuning.' },
        ],
      },
      {
        semesterNumber: 6, title: 'Semester 6',
        subjects: [
          { name: 'Cyber Security', code: 'IT601', slug: 'it601-cyber-security', description: 'Cryptography, network security, and ethical hacking.' },
          { name: 'Cloud Computing', code: 'IT602', slug: 'it602-cloud-computing', description: 'Cloud architectures, virtualization, and AWS/Azure fundamentals.' },
          { name: 'Mobile Application Development', code: 'IT603', slug: 'it603-mobile-dev', description: 'Mobile app development using React Native or Flutter.' },
          { name: 'IT Project Management', code: 'IT604', slug: 'it604-project-management', description: 'Project planning, scheduling, risk management, and agile methodologies.' },
        ],
      },
      {
        semesterNumber: 7, title: 'Semester 7',
        subjects: [
          { name: 'Network Security', code: 'IT701', slug: 'it701-network-security', description: 'Advanced network security, intrusion detection, and VPN technologies.' },
          { name: 'Data Warehousing and Mining', code: 'IT702', slug: 'it702-data-warehouse', description: 'ETL processes, OLAP, data mining techniques, and visualization.' },
          { name: 'DevOps', code: 'IT703', slug: 'it703-devops', description: 'CI/CD, containerization, Docker, and Kubernetes.' },
          { name: 'Technical Writing', code: 'EN301', slug: 'en301-technical-writing', description: 'Research papers and technical documentation.' },
        ],
      },
      {
        semesterNumber: 8, title: 'Semester 8',
        subjects: [
          { name: 'Emerging Technologies', code: 'IT801', slug: 'it801-emerging-tech', description: 'AI, IoT, blockchain, and quantum computing overview.' },
          { name: 'IT Ethics and Law', code: 'IT802', slug: 'it802-ethics-law', description: 'Cyber law, intellectual property, privacy, and IT governance.' },
          { name: 'Capstone Project', code: 'IT899', slug: 'it899-capstone', description: 'Full-stack IT project applying skills from all semesters.' },
        ],
      },
    ],
  },
  {
    name: 'Bachelor of Computer Engineering',
    slug: 'be-computer',
    description: '4-year, 8-semester engineering degree focusing on hardware, software, embedded systems, and computer architecture.',
    semesters: [
      {
        semesterNumber: 1, title: 'Semester 1',
        subjects: [
          { name: 'Engineering Mathematics I', code: 'MATH101', slug: 'math101-eng-math-i', description: 'Calculus, vectors, and matrix algebra for engineers.' },
          { name: 'Engineering Physics', code: 'PHY101', slug: 'phy101-eng-physics', description: 'Mechanics, wave motion, thermodynamics, and optics.' },
          { name: 'Engineering Chemistry', code: 'CHM101', slug: 'chm101-eng-chemistry', description: 'Materials science, polymers, corrosion, and water treatment.' },
          { name: 'Programming in C', code: 'CT101', slug: 'ct101-c-programming', description: 'Structured programming using C language.' },
          { name: 'Engineering Drawing', code: 'ME101', slug: 'me101-eng-drawing', description: 'Technical drawing, orthographic projections, and CAD basics.' },
        ],
      },
      {
        semesterNumber: 2, title: 'Semester 2',
        subjects: [
          { name: 'Engineering Mathematics II', code: 'MATH102', slug: 'math102-eng-math-ii', description: 'Differential equations, complex analysis, and Laplace transforms.' },
          { name: 'Basic Electronics', code: 'CT102', slug: 'ct102-basic-electronics', description: 'Semiconductor devices, diodes, transistors, and amplifiers.' },
          { name: 'Data Structures', code: 'CT201', slug: 'ct201-data-structures', description: 'Data structures, algorithm analysis, and complexity.' },
          { name: 'Electrical Circuits', code: 'EE101', slug: 'ee101-electrical-circuits', description: 'DC/AC circuit analysis, network theorems, and phasor diagrams.' },
          { name: 'English', code: 'EN101', slug: 'en101-english', description: 'Technical communication and report writing.' },
        ],
      },
      {
        semesterNumber: 3, title: 'Semester 3',
        subjects: [
          { name: 'Engineering Mathematics III', code: 'MATH201', slug: 'math201-eng-math-iii', description: 'Numerical methods, probability, and statistical analysis.' },
          { name: 'Digital Logic Design', code: 'CT202', slug: 'ct202-digital-logic', description: 'Boolean algebra, logic gates, flip-flops, and counters.' },
          { name: 'Object Oriented Programming', code: 'CT203', slug: 'ct203-oop', description: 'OOP concepts using C++ or Java.' },
          { name: 'Electromagnetics', code: 'EE201', slug: 'ee201-electromagnetics', description: 'Electrostatics, magnetostatics, and Maxwell equations.' },
          { name: 'Thermodynamics', code: 'ME201', slug: 'me201-thermodynamics', description: 'Laws of thermodynamics, cycles, and heat transfer.' },
        ],
      },
      {
        semesterNumber: 4, title: 'Semester 4',
        subjects: [
          { name: 'Computer Architecture', code: 'CT301', slug: 'ct301-computer-architecture', description: 'CPU design, memory hierarchy, pipelining, and RISC/CISC.' },
          { name: 'Operating Systems', code: 'CT302', slug: 'ct302-operating-systems', description: 'Process management, memory management, and file systems.' },
          { name: 'Database Systems', code: 'CT303', slug: 'ct303-database-systems', description: 'Relational databases, SQL, normalization, and ER modeling.' },
          { name: 'Signal and System', code: 'CT304', slug: 'ct304-signal-system', description: 'Continuous and discrete signals, Fourier analysis, and Z-transform.' },
          { name: 'Theory of Computation', code: 'CT305', slug: 'ct305-theory-computation', description: 'Automata theory, formal languages, and computability.' },
        ],
      },
      {
        semesterNumber: 5, title: 'Semester 5',
        subjects: [
          { name: 'Computer Networks', code: 'CT401', slug: 'ct401-computer-networks', description: 'Network models, protocols, routing, and TCP/IP.' },
          { name: 'Algorithm Analysis and Design', code: 'CT402', slug: 'ct402-algorithm-design', description: 'Algorithm paradigms, complexity, and NP-completeness.' },
          { name: 'Microprocessor and Interfacing', code: 'CT403', slug: 'ct403-microprocessor', description: '8086 architecture, assembly language, and interfacing.' },
          { name: 'Software Engineering', code: 'CT404', slug: 'ct404-software-engineering', description: 'SDLC, agile methods, testing, and project management.' },
          { name: 'Digital Signal Processing', code: 'EE301', slug: 'ee301-dsp', description: 'Sampling, Z-transform, DFT, and digital filters.' },
        ],
      },
      {
        semesterNumber: 6, title: 'Semester 6',
        subjects: [
          { name: 'Embedded Systems', code: 'CT501', slug: 'ct501-embedded-systems', description: 'Microcontrollers, RTOS, and embedded C programming.' },
          { name: 'VLSI Design', code: 'CT502', slug: 'ct502-vlsi-design', description: 'CMOS circuits, FPGA design, and hardware description languages.' },
          { name: 'Web Technologies', code: 'CT503', slug: 'ct503-web-technologies', description: 'HTML, CSS, JavaScript, and modern web frameworks.' },
          { name: 'Compiler Construction', code: 'CT504', slug: 'ct504-compiler-construction', description: 'Lexical analysis, parsing, code generation, and optimization.' },
          { name: 'Control Systems', code: 'EE401', slug: 'ee401-control-systems', description: 'Transfer functions, block diagrams, and stability analysis.' },
        ],
      },
      {
        semesterNumber: 7, title: 'Semester 7',
        subjects: [
          { name: 'Network Security', code: 'CT601', slug: 'ct601-network-security', description: 'Cryptography, firewalls, IDS, and security protocols.' },
          { name: 'Artificial Intelligence', code: 'CT602', slug: 'ct602-artificial-intelligence', description: 'Search, knowledge representation, and machine learning.' },
          { name: 'Internet of Things', code: 'CT603', slug: 'ct603-iot', description: 'IoT architectures, sensors, protocols, and applications.' },
          { name: 'Technical Writing', code: 'EN301', slug: 'en301-technical-writing', description: 'Research paper writing and technical documentation.' },
        ],
      },
      {
        semesterNumber: 8, title: 'Semester 8',
        subjects: [
          { name: 'Machine Learning', code: 'CT701', slug: 'ct701-machine-learning', description: 'Supervised and unsupervised learning, neural networks.' },
          { name: 'Cloud Computing', code: 'CT702', slug: 'ct702-cloud-computing', description: 'Cloud architectures, virtualization, and deployment.' },
          { name: 'Final Year Project', code: 'CT799', slug: 'ct799-final-project', description: 'Engineering capstone project.' },
        ],
      },
    ],
  },
  {
    name: 'Bachelor of Civil Engineering',
    slug: 'be-civil',
    description: '4-year, 8-semester engineering degree focusing on structural, transportation, and water resources engineering.',
    semesters: [
      {
        semesterNumber: 1, title: 'Semester 1',
        subjects: [
          { name: 'Engineering Mathematics I', code: 'CE101', slug: 'ce101-math-i', description: 'Calculus, vectors, and matrix algebra.' },
          { name: 'Engineering Physics', code: 'CE102', slug: 'ce102-physics', description: 'Mechanics, wave motion, and thermodynamics.' },
          { name: 'Engineering Chemistry', code: 'CE103', slug: 'ce103-chemistry', description: 'Materials science, cement, concrete, and steel.' },
          { name: 'Engineering Drawing', code: 'CE104', slug: 'ce104-drawing', description: 'Technical drawing and CAD.' },
          { name: 'Programming in C', code: 'CE105', slug: 'ce105-c-programming', description: 'Introduction to programming.' },
        ],
      },
      {
        semesterNumber: 2, title: 'Semester 2',
        subjects: [
          { name: 'Engineering Mathematics II', code: 'CE201', slug: 'ce201-math-ii', description: 'Differential equations and numerical methods.' },
          { name: 'Basic Electronics', code: 'CE202', slug: 'ce202-electronics', description: 'Semiconductor devices and circuits.' },
          { name: 'Engineering Mechanics', code: 'CE203', slug: 'ce203-engineering-mechanics', description: 'Statics, dynamics, and mechanics of materials.' },
          { name: 'Electrical Circuits', code: 'CE204', slug: 'ce204-electrical-circuits', description: 'DC/AC circuit analysis.' },
          { name: 'English', code: 'CE205', slug: 'ce205-english', description: 'Technical communication.' },
        ],
      },
      {
        semesterNumber: 3, title: 'Semester 3',
        subjects: [
          { name: 'Engineering Mathematics III', code: 'CE301', slug: 'ce301-math-iii', description: 'Numerical analysis and statistics.' },
          { name: 'Strength of Materials', code: 'CE302', slug: 'ce302-strength-materials', description: 'Stress, strain, deflection, and failure theories.' },
          { name: 'Surveying I', code: 'CE303', slug: 'ce303-surveying-i', description: 'Chain surveying, compass surveying, and leveling.' },
          { name: 'Fluid Mechanics', code: 'CE304', slug: 'ce304-fluid-mechanics', description: 'Fluid properties, hydrostatics, and flow dynamics.' },
          { name: 'Building Materials', code: 'CE305', slug: 'ce305-building-materials', description: 'Properties and uses of construction materials.' },
        ],
      },
      {
        semesterNumber: 4, title: 'Semester 4',
        subjects: [
          { name: 'Structural Analysis I', code: 'CE401', slug: 'ce401-structural-analysis-i', description: 'Analysis of determinate structures, trusses, and beams.' },
          { name: 'Geotechnical Engineering I', code: 'CE402', slug: 'ce402-geotechnical-i', description: 'Soil properties, classification, and compaction.' },
          { name: 'Surveying II', code: 'CE403', slug: 'ce403-surveying-ii', description: 'Theodolite surveying, plane table, and curving.' },
          { name: 'Hydrology and Water Resources', code: 'CE404', slug: 'ce404-hydrology', description: 'Rainfall, runoff, and water resource management.' },
          { name: 'Construction Technology', code: 'CE405', slug: 'ce405-construction-tech', description: 'Construction methods, planning, and scheduling.' },
        ],
      },
      {
        semesterNumber: 5, title: 'Semester 5',
        subjects: [
          { name: 'Structural Analysis II', code: 'CE501', slug: 'ce501-structural-analysis-ii', description: 'Indeterminate structures, moment distribution, and matrix methods.' },
          { name: 'Design of Steel Structures', code: 'CE502', slug: 'ce502-steel-design', description: 'Design of tension, compression, and beam members.' },
          { name: 'Geotechnical Engineering II', code: 'CE503', slug: 'ce503-geotechnical-ii', description: 'Bearing capacity, settlement, and slope stability.' },
          { name: 'Transportation Engineering I', code: 'CE504', slug: 'ce504-transportation-i', description: 'Highway engineering, geometric design, and traffic analysis.' },
          { name: 'Engineering Economy', code: 'CE505', slug: 'ce505-engineering-economy', description: 'Time value of money, cost analysis, and project evaluation.' },
        ],
      },
      {
        semesterNumber: 6, title: 'Semester 6',
        subjects: [
          { name: 'Design of Concrete Structures', code: 'CE601', slug: 'ce601-concrete-design', description: 'RCC beam, slab, column, and footing design.' },
          { name: 'Foundation Engineering', code: 'CE602', slug: 'ce602-foundation-engineering', description: 'Foundation types, pile foundations, and retaining walls.' },
          { name: 'Transportation Engineering II', code: 'CE603', slug: 'ce605-transportation-ii', description: 'Railway, airport, and harbor engineering.' },
          { name: 'Hydraulics and Hydraulic Machines', code: 'CE604', slug: 'ce604-hydraulics', description: 'Open channel flow, pipe flow, and pumps.' },
          { name: 'Environmental Engineering I', code: 'CE605', slug: 'ce605-environmental-i', description: 'Water supply engineering and quality control.' },
        ],
      },
      {
        semesterNumber: 7, title: 'Semester 7',
        subjects: [
          { name: 'Estimation and Costing', code: 'CE701', slug: 'ce701-estimation-costing', description: 'Quantity estimation, rate analysis, and valuation.' },
          { name: 'Environmental Engineering II', code: 'CE702', slug: 'ce702-environmental-ii', description: 'Wastewater treatment and solid waste management.' },
          { name: 'Construction Management', code: 'CE703', slug: 'ce703-construction-management', description: 'Project management, CPM, PERT, and contracts.' },
          { name: 'Earthquake Engineering', code: 'CE704', slug: 'ce704-earthquake-engineering', description: 'Seismic analysis and earthquake-resistant design.' },
        ],
      },
      {
        semesterNumber: 8, title: 'Semester 8',
        subjects: [
          { name: 'Engineering Professional Practice', code: 'CE801', slug: 'ce801-professional-practice', description: 'Ethics, codes, and professional conduct.' },
          { name: 'Applied Mathematics', code: 'CE802', slug: 'ce802-applied-math', description: 'Finite element methods and numerical modeling.' },
          { name: 'Final Year Project', code: 'CE899', slug: 'ce899-final-project', description: 'Capstone civil engineering project.' },
        ],
      },
    ],
  },
  {
    name: 'Bachelor of Business Administration',
    slug: 'bba',
    description: '4-year, 8-semester undergraduate program in business management and administration.',
    semesters: [
      {
        semesterNumber: 1, title: 'Semester 1',
        subjects: [
          { name: 'Principles of Management', code: 'BBA101', slug: 'bba101-principles-management', description: 'Management theories, planning, organizing, staffing, and controlling.' },
          { name: 'Business Economics', code: 'BBA102', slug: 'bba102-business-economics', description: 'Micro and macroeconomic principles for business decisions.' },
          { name: 'Financial Accounting', code: 'BBA103', slug: 'bba103-financial-accounting', description: 'Accounting fundamentals, journal entries, and financial statements.' },
          { name: 'Business Communication', code: 'BBA104', slug: 'bba104-business-communication', description: 'Effective business writing, presentations, and interpersonal skills.' },
          { name: 'Business Mathematics', code: 'BBA105', slug: 'bba105-business-math', description: 'Mathematical tools for business analysis and decision making.' },
        ],
      },
      {
        semesterNumber: 2, title: 'Semester 2',
        subjects: [
          { name: 'Organizational Behavior', code: 'BBA201', slug: 'bba201-organizational-behavior', description: 'Individual and group behavior, motivation, and leadership.' },
          { name: 'Business Statistics', code: 'BBA202', slug: 'bba202-business-statistics', description: 'Statistical methods for business analysis.' },
          { name: 'Cost Accounting', code: 'BBA203', slug: 'bba203-cost-accounting', description: 'Cost classification, budgeting, and cost control.' },
          { name: 'Microeconomics', code: 'BBA204', slug: 'bba204-microeconomics', description: 'Demand, supply, market structures, and consumer behavior.' },
          { name: 'English for Business', code: 'BBA205', slug: 'bba205-english-business', description: 'Business English, report writing, and correspondence.' },
        ],
      },
      {
        semesterNumber: 3, title: 'Semester 3',
        subjects: [
          { name: 'Financial Management', code: 'BBA301', slug: 'bba301-financial-management', description: 'Capital budgeting, cost of capital, and working capital management.' },
          { name: 'Marketing Management', code: 'BBA302', slug: 'bba302-marketing-management', description: 'Marketing mix, consumer behavior, and market research.' },
          { name: 'Human Resource Management', code: 'BBA303', slug: 'bba303-hrm', description: 'Recruitment, training, compensation, and performance management.' },
          { name: 'Macroeconomics', code: 'BBA304', slug: 'bba304-macroeconomics', description: 'National income, inflation, monetary and fiscal policy.' },
          { name: 'Business Law', code: 'BBA305', slug: 'bba305-business-law', description: 'Contract law, company law, and business regulations.' },
        ],
      },
      {
        semesterNumber: 4, title: 'Semester 4',
        subjects: [
          { name: 'Strategic Management', code: 'BBA401', slug: 'bba401-strategic-management', description: 'Strategy formulation, implementation, and evaluation.' },
          { name: 'Management Accounting', code: 'BBA402', slug: 'bba402-management-accounting', description: 'Budgeting, variance analysis, and decision making.' },
          { name: 'Operations Management', code: 'BBA403', slug: 'bba403-operations-management', description: 'Production planning, quality management, and supply chain.' },
          { name: 'Business Ethics', code: 'BBA404', slug: 'bba404-business-ethics', description: 'Ethical decision making and corporate social responsibility.' },
        ],
      },
      {
        semesterNumber: 5, title: 'Semester 5',
        subjects: [
          { name: 'Entrepreneurship', code: 'BBA501', slug: 'bba501-entrepreneurship', description: 'Business plan development, startup management, and innovation.' },
          { name: 'International Business', code: 'BBA502', slug: 'bba502-international-business', description: 'Global trade, FDI, and international marketing.' },
          { name: 'E-Commerce', code: 'BBA503', slug: 'bba503-e-commerce', description: 'Online business models, digital marketing, and e-payment systems.' },
          { name: 'Research Methods', code: 'BBA504', slug: 'bba504-research-methods', description: 'Business research design, data collection, and analysis.' },
        ],
      },
      {
        semesterNumber: 6, title: 'Semester 6',
        subjects: [
          { name: 'Consumer Behavior', code: 'BBA601', slug: 'bba601-consumer-behavior', description: 'Psychological and social factors influencing buying decisions.' },
          { name: 'Brand Management', code: 'BBA602', slug: 'bba602-brand-management', description: 'Brand equity, positioning, and brand architecture.' },
          { name: 'Banking and Finance', code: 'BBA603', slug: 'bba603-banking-finance', description: 'Banking operations, financial markets, and instruments.' },
          { name: 'Corporate Governance', code: 'BBA604', slug: 'bba604-corporate-governance', description: 'Board structure, shareholder rights, and compliance.' },
        ],
      },
      {
        semesterNumber: 7, title: 'Semester 7',
        subjects: [
          { name: 'Leadership and Change Management', code: 'BBA701', slug: 'bba701-leadership', description: 'Leadership theories, organizational change, and transformation.' },
          { name: 'Taxation and Auditing', code: 'BBA702', slug: 'bba702-taxation-auditing', description: 'Tax laws, auditing standards, and compliance.' },
          { name: 'Business Analytics', code: 'BBA703', slug: 'bba703-business-analytics', description: 'Data analysis tools for business decision making.' },
          { name: 'Technical Writing', code: 'BBA704', slug: 'bba704-technical-writing', description: 'Business reports, proposals, and research papers.' },
        ],
      },
      {
        semesterNumber: 8, title: 'Semester 8',
        subjects: [
          { name: 'Total Quality Management', code: 'BBA801', slug: 'bba801-tqm', description: 'Quality principles, Six Sigma, and continuous improvement.' },
          { name: 'Business Policy and Strategy', code: 'BBA802', slug: 'bba802-business-policy', description: 'Strategic planning and implementation at the corporate level.' },
          { name: 'Capstone Project', code: 'BBA899', slug: 'bba899-capstone', description: 'Comprehensive business project or internship report.' },
        ],
      },
    ],
  },
  {
    name: 'Bachelor of Business Studies',
    slug: 'bbs',
    description: '4-year, 8-semester undergraduate program in business studies.',
    semesters: [
      {
        semesterNumber: 1, title: 'Semester 1',
        subjects: [
          { name: 'Principles of Management', code: 'BBS101', slug: 'bbs101-principles-management', description: 'Introduction to management theories and practices.' },
          { name: 'Business Economics I', code: 'BBS102', slug: 'bbs102-business-economics-i', description: 'Microeconomic principles for business.' },
          { name: 'Financial Accounting', code: 'BBS103', slug: 'bbs103-financial-accounting', description: 'Accounting fundamentals and double-entry bookkeeping.' },
          { name: 'Business Communication', code: 'BBS104', slug: 'bbs104-business-communication', description: 'Business writing and presentation skills.' },
        ],
      },
      {
        semesterNumber: 2, title: 'Semester 2',
        subjects: [
          { name: 'Business Statistics', code: 'BBS201', slug: 'bbs201-business-statistics', description: 'Statistical methods for business analysis.' },
          { name: 'Cost and Management Accounting', code: 'BBS202', slug: 'bbs202-cost-mgmt-accounting', description: 'Cost accounting and management accounting techniques.' },
          { name: 'Business Economics II', code: 'BBS203', slug: 'bbs203-business-economics-ii', description: 'Macroeconomic principles for business.' },
          { name: 'English for Business', code: 'BBS204', slug: 'bbs204-english-business', description: 'Business English and correspondence.' },
        ],
      },
      {
        semesterNumber: 3, title: 'Semester 3',
        subjects: [
          { name: 'Financial Management', code: 'BBS301', slug: 'bbs301-financial-management', description: 'Corporate finance and financial decision making.' },
          { name: 'Marketing Management', code: 'BBS302', slug: 'bbs302-marketing-management', description: 'Marketing concepts and strategies.' },
          { name: 'Business Law', code: 'BBS303', slug: 'bbs303-business-law', description: 'Commercial law and business regulations.' },
          { name: 'Organizational Behavior', code: 'BBS304', slug: 'bbs304-organizational-behavior', description: 'Individual and group behavior in organizations.' },
        ],
      },
      {
        semesterNumber: 4, title: 'Semester 4',
        subjects: [
          { name: 'Human Resource Management', code: 'BBS401', slug: 'bbs401-hrm', description: 'Recruitment, training, and performance management.' },
          { name: 'Strategic Management', code: 'BBS402', slug: 'bbs402-strategic-management', description: 'Strategy formulation and implementation.' },
          { name: 'Operations Management', code: 'BBS403', slug: 'bbs403-operations-management', description: 'Production and operations management.' },
          { name: 'Business Ethics and CSR', code: 'BBS404', slug: 'bbs404-business-ethics', description: 'Ethics and corporate social responsibility.' },
        ],
      },
      {
        semesterNumber: 5, title: 'Semester 5',
        subjects: [
          { name: 'Entrepreneurship Development', code: 'BBS501', slug: 'bbs501-entrepreneurship', description: 'Business planning and startup management.' },
          { name: 'International Business', code: 'BBS502', slug: 'bbs502-international-business', description: 'Global business environment and trade.' },
          { name: 'Research Methods', code: 'BBS503', slug: 'bbs503-research-methods', description: 'Business research methodology.' },
          { name: 'E-Commerce', code: 'BBS504', slug: 'bbs504-e-commerce', description: 'Online business and digital marketing.' },
        ],
      },
      {
        semesterNumber: 6, title: 'Semester 6',
        subjects: [
          { name: 'Banking and Finance', code: 'BBS601', slug: 'bbs601-banking-finance', description: 'Financial institutions and instruments.' },
          { name: 'Consumer Behavior', code: 'BBS602', slug: 'bbs602-consumer-behavior', description: 'Psychology of consumer buying decisions.' },
          { name: 'Taxation', code: 'BBS603', slug: 'bbs603-taxation', description: 'Tax laws and compliance.' },
          { name: 'Corporate Governance', code: 'BBS604', slug: 'bbs604-corporate-governance', description: 'Governance frameworks and regulations.' },
        ],
      },
      {
        semesterNumber: 7, title: 'Semester 7',
        subjects: [
          { name: 'Leadership', code: 'BBS701', slug: 'bbs701-leadership', description: 'Leadership styles and organizational effectiveness.' },
          { name: 'Business Analytics', code: 'BBS702', slug: 'bbs702-business-analytics', description: 'Data-driven business decision making.' },
          { name: 'Technical Writing', code: 'BBS703', slug: 'bbs703-technical-writing', description: 'Business reports and documentation.' },
        ],
      },
      {
        semesterNumber: 8, title: 'Semester 8',
        subjects: [
          { name: 'Total Quality Management', code: 'BBS801', slug: 'bbs801-tqm', description: 'Quality management and continuous improvement.' },
          { name: 'Business Policy', code: 'BBS802', slug: 'bbs802-business-policy', description: 'Corporate strategy and policy analysis.' },
          { name: 'Capstone Project', code: 'BBS899', slug: 'bbs899-capstone', description: 'Comprehensive business project.' },
        ],
      },
    ],
  },
  {
    name: 'Bachelor in Hotel Management',
    slug: 'bhm',
    description: '4-year, 8-semester program in hospitality and hotel management.',
    semesters: [
      {
        semesterNumber: 1, title: 'Semester 1',
        subjects: [
          { name: 'Introduction to Hotel Management', code: 'BHM101', slug: 'bhm101-intro-hm', description: 'Overview of hospitality industry and hotel operations.' },
          { name: 'Food and Beverage Production I', code: 'BHM102', slug: 'bhm102-fb-production-i', description: 'Basic cooking techniques, kitchen operations, and food safety.' },
          { name: 'Front Office Management', code: 'BHM103', slug: 'bhm103-front-office', description: 'Reception operations, guest relations, and reservation systems.' },
          { name: 'Business Communication', code: 'BHM104', slug: 'bhm104-business-communication', description: 'Communication skills for hospitality professionals.' },
          { name: 'Business Mathematics', code: 'BHM105', slug: 'bhm105-business-math', description: 'Mathematical applications in hotel management.' },
        ],
      },
      {
        semesterNumber: 2, title: 'Semester 2',
        subjects: [
          { name: 'Food and Beverage Production II', code: 'BHM201', slug: 'bhm201-fb-production-ii', description: 'Advanced cooking methods and international cuisines.' },
          { name: 'Housekeeping Management', code: 'BHM202', slug: 'bhm202-housekeeping', description: 'Room maintenance, laundry operations, and hygiene standards.' },
          { name: 'Food and Beverage Service', code: 'BHM203', slug: 'bhm203-fb-service', description: 'Restaurant service, bar operations, and event catering.' },
          { name: 'Principles of Management', code: 'BHM204', slug: 'bhm204-principles-management', description: 'Management functions applied to hospitality.' },
          { name: 'Accounting for Hospitality', code: 'BHM205', slug: 'bhm205-accounting', description: 'Financial accounting for hotels and restaurants.' },
        ],
      },
      {
        semesterNumber: 3, title: 'Semester 3',
        subjects: [
          { name: 'Hospitality Marketing', code: 'BHM301', slug: 'bhm301-hospitality-marketing', description: 'Marketing strategies for hotels and tourism.' },
          { name: 'Food and Beverage Management', code: 'BHM302', slug: 'bhm302-fb-management', description: 'Restaurant management, menu planning, and cost control.' },
          { name: 'Lodging Operations', code: 'BHM303', slug: 'bhm303-lodging-operations', description: 'Hotel operations, night audit, and revenue management.' },
          { name: 'Human Resource Management', code: 'BHM304', slug: 'bhm304-hrm', description: 'Staffing, training, and labor management in hospitality.' },
        ],
      },
      {
        semesterNumber: 4, title: 'Semester 4',
        subjects: [
          { name: 'Tourism Management', code: 'BHM401', slug: 'bhm401-tourism-management', description: 'Tourism industry, destination management, and travel agencies.' },
          { name: 'Financial Management', code: 'BHM402', slug: 'bhm402-financial-management', description: 'Hotel financial planning and investment decisions.' },
          { name: 'Banquet and Event Management', code: 'BHM403', slug: 'bhm403-banquet-event', description: 'Event planning, coordination, and execution.' },
          { name: 'Business Law for Hospitality', code: 'BHM404', slug: 'bhm404-business-law', description: 'Legal aspects of hospitality business.' },
        ],
      },
      {
        semesterNumber: 5, title: 'Semester 5',
        subjects: [
          { name: 'Revenue Management', code: 'BHM501', slug: 'bhm501-revenue-management', description: 'Pricing strategies, yield management, and forecasting.' },
          { name: 'Hospitality Information Systems', code: 'BHM502', slug: 'bhm502-info-systems', description: 'PMS, POS, and technology in hospitality.' },
          { name: 'Quality Management', code: 'BHM503', slug: 'bhm503-quality-management', description: 'Service quality standards and customer satisfaction.' },
          { name: 'Research Methods', code: 'BHM504', slug: 'bhm504-research-methods', description: 'Hospitality research design and data analysis.' },
        ],
      },
      {
        semesterNumber: 6, title: 'Semester 6',
        subjects: [
          { name: 'Strategic Management', code: 'BHM601', slug: 'bhm601-strategic-management', description: 'Strategic planning for hospitality organizations.' },
          { name: 'Wine and Beverage Management', code: 'BHM602', slug: 'bhm602-wine-beverage', description: 'Beverage service, wine knowledge, and bar management.' },
          { name: 'Sustainable Hospitality', code: 'BHM603', slug: 'bhm603-sustainable-hospitality', description: 'Green practices and sustainability in hotels.' },
          { name: 'International Hospitality', code: 'BHM604', slug: 'bhm604-international-hospitality', description: 'Global hospitality brands and cross-cultural management.' },
        ],
      },
      {
        semesterNumber: 7, title: 'Semester 7',
        subjects: [
          { name: 'Hotel Development and Planning', code: 'BHM701', slug: 'bhm701-hotel-development', description: 'Hotel project planning, feasibility, and design.' },
          { name: 'Crisis Management', code: 'BHM702', slug: 'bhm702-crisis-management', description: 'Emergency response and crisis management in hospitality.' },
          { name: 'Technical Writing', code: 'BHM703', slug: 'bhm703-technical-writing', description: 'Industry reports and professional documentation.' },
        ],
      },
      {
        semesterNumber: 8, title: 'Semester 8',
        subjects: [
          { name: 'Entrepreneurship in Hospitality', code: 'BHM801', slug: 'bhm801-entrepreneurship', description: 'Starting and managing hospitality businesses.' },
          { name: 'Industry Internship', code: 'BHM802', slug: 'bhm802-internship', description: 'Practical hotel management internship experience.' },
          { name: 'Capstone Project', code: 'BHM899', slug: 'bhm899-capstone', description: 'Hospitality management capstone project.' },
        ],
      },
    ],
  },
  {
    name: 'Bachelor of Architecture',
    slug: 'b-arch',
    description: '5-year, 10-semester program in architecture and building design.',
    semesters: [
      {
        semesterNumber: 1, title: 'Semester 1',
        subjects: [
          { name: 'Architectural Design I', code: 'ARCH101', slug: 'arch101-design-i', description: 'Introduction to architectural design principles and spatial concepts.' },
          { name: 'Building Materials', code: 'ARCH102', slug: 'arch102-building-materials', description: 'Properties and uses of construction materials.' },
          { name: 'Engineering Drawing', code: 'ARCH103', slug: 'arch103-engineering-drawing', description: 'Technical drawing and CAD basics.' },
          { name: 'Mathematics', code: 'ARCH104', slug: 'arch104-mathematics', description: 'Mathematics for architects.' },
          { name: 'English', code: 'ARCH105', slug: 'arch105-english', description: 'Communication skills for architects.' },
        ],
      },
      {
        semesterNumber: 2, title: 'Semester 2',
        subjects: [
          { name: 'Architectural Design II', code: 'ARCH201', slug: 'arch201-design-ii', description: 'Design of small-scale buildings and spaces.' },
          { name: 'History of Architecture', code: 'ARCH202', slug: 'arch202-history', description: 'Ancient to modern architectural history.' },
          { name: 'Structural Mechanics', code: 'ARCH203', slug: 'arch203-structural-mechanics', description: 'Basic structural analysis for architects.' },
          { name: 'Surveying', code: 'ARCH204', slug: 'arch204-surveying', description: 'Site surveying and measurement.' },
        ],
      },
      {
        semesterNumber: 3, title: 'Semester 3',
        subjects: [
          { name: 'Architectural Design III', code: 'ARCH301', slug: 'arch301-design-iii', description: 'Medium-scale building design and site planning.' },
          { name: 'Building Construction', code: 'ARCH302', slug: 'arch302-building-construction', description: 'Construction methods and techniques.' },
          { name: 'Environmental Studies', code: 'ARCH303', slug: 'arch303-environmental', description: 'Climate, environment, and sustainable design.' },
          { name: 'Building Services', code: 'ARCH304', slug: 'arch304-building-services', description: 'MEP systems in buildings.' },
        ],
      },
      {
        semesterNumber: 4, title: 'Semester 4',
        subjects: [
          { name: 'Architectural Design IV', code: 'ARCH401', slug: 'arch401-design-iv', description: 'Complex building design and urban contexts.' },
          { name: 'Urban Planning', code: 'ARCH402', slug: 'arch402-urban-planning', description: 'City planning, zoning, and urban design.' },
          { name: 'Estimation and Costing', code: 'ARCH403', slug: 'arch403-estimation', description: 'Quantity surveying and cost estimation.' },
          { name: 'Landscape Architecture', code: 'ARCH404', slug: 'arch404-landscape', description: 'Landscape design and outdoor spaces.' },
        ],
      },
      {
        semesterNumber: 5, title: 'Semester 5',
        subjects: [
          { name: 'Architectural Design V', code: 'ARCH501', slug: 'arch501-design-v', description: 'Advanced design projects with real-world constraints.' },
          { name: 'Professional Practice', code: 'ARCH502', slug: 'arch502-professional-practice', description: 'Architectural practice, contracts, and regulations.' },
          { name: 'Building Regulations', code: 'ARCH503', slug: 'arch503-building-regulations', description: 'Building codes, bye-laws, and compliance.' },
          { name: 'Research Methods', code: 'ARCH504', slug: 'arch504-research-methods', description: 'Architectural research methodology.' },
        ],
      },
      {
        semesterNumber: 6, title: 'Semester 6',
        subjects: [
          { name: 'Architectural Design VI', code: 'ARCH601', slug: 'arch601-design-vi', description: 'Large-scale and public building design.' },
          { name: 'Conservation Architecture', code: 'ARCH602', slug: 'arch602-conservation', description: 'Heritage conservation and restoration.' },
          { name: 'Digital Architecture', code: 'ARCH603', slug: 'arch603-digital', description: 'Computational design and parametric architecture.' },
          { name: 'Interior Design', code: 'ARCH604', slug: 'arch604-interior-design', description: 'Interior space planning and design.' },
        ],
      },
      {
        semesterNumber: 7, title: 'Semester 7',
        subjects: [
          { name: 'Architectural Design VII', code: 'ARCH701', slug: 'arch701-design-vii', description: 'Thesis-level design project.' },
          { name: 'Sustainable Architecture', code: 'ARCH702', slug: 'arch702-sustainable', description: 'Green building design and LEED standards.' },
          { name: 'Housing Design', code: 'ARCH703', slug: 'arch703-housing', description: 'Residential architecture and community planning.' },
        ],
      },
      {
        semesterNumber: 8, title: 'Semester 8',
        subjects: [
          { name: 'Architectural Design VIII', code: 'ARCH801', slug: 'arch801-design-viii', description: 'Final thesis design project.' },
          { name: 'Construction Management', code: 'ARCH802', slug: 'arch802-construction-mgmt', description: 'Project management for construction.' },
        ],
      },
      {
        semesterNumber: 9, title: 'Semester 9',
        subjects: [
          { name: 'Practical Training', code: 'ARCH901', slug: 'arch901-practical', description: 'On-site practical training in architectural firms.' },
          { name: 'Technical Writing', code: 'ARCH902', slug: 'arch902-technical-writing', description: 'Research papers and project reports.' },
        ],
      },
      {
        semesterNumber: 10, title: 'Semester 10',
        subjects: [
          { name: 'Thesis Project', code: 'ARCH999', slug: 'arch999-thesis', description: 'Final architectural thesis project.' },
        ],
      },
    ],
  },
];

// ─── Main Seed ───
async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log('Cleared all collections.\n');

  // 1. Admin
  console.log('Creating admin...');
  const adminPw = await hash('Admin@123');
  const admin = await User.create({
    fullname: 'Admin NoteUniX',
    email: 'admin@noteunix.com',
    passwordHash: adminPw,
    role: 'admin',
    isVerified: true,
    emailVerified: true,
  });
  console.log('  Admin: admin@noteunix.com / Admin@123');

  // 2. University
  console.log('\nCreating Far Western University...');
  const university = await University.create(fwu);
  console.log(`  ${university.name}`);

  // 3. Courses → Semesters → Subjects
  let totalCourses = 0, totalSemesters = 0, totalSubjects = 0;

  for (const courseData of courses) {
    const course = await Course.create({
      universityId: university._id,
      name: courseData.name,
      slug: courseData.slug,
      description: courseData.description,
    });
    totalCourses++;

    for (const semData of courseData.semesters) {
      const semester = await Semester.create({
        courseId: course._id,
        semesterNumber: semData.semesterNumber,
        title: semData.title,
        description: `${semData.title} of ${courseData.name}`,
      });
      totalSemesters++;

      for (const subData of semData.subjects) {
        await Subject.create({
          semesterId: semester._id,
          name: subData.name,
          code: subData.code,
          slug: subData.slug,
          description: subData.description,
        });
        totalSubjects++;
      }
    }
  }

  // Summary
  console.log('\n════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('════════════════════════════════════════');
  console.log(`  University:  ${university.name}`);
  console.log(`  Courses:     ${totalCourses}`);
  console.log(`  Semesters:   ${totalSemesters}`);
  console.log(`  Subjects:    ${totalSubjects}`);
  console.log('');
  console.log('  Admin:       admin@noteunix.com / Admin@123');
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
