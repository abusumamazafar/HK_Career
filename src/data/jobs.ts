export type JobRoleId = 'client-relations-officer' | 'civil-engineer';

export interface JobRole {
  id: JobRoleId;
  indexLabel: string;
  title: string;
  eligibilityNote: string;
  salary: string;
  salaryDetail: string;
  jobType: string;
  location: string;
  summary: string;
  responsibilities: string[];
  preferredExperience: string[];
  qualificationLabel: string;
  qualificationOptions: string[];
  summaryPlaceholder: string;
}

export const COMPANY_INFO = {
  name: 'HK Construction & Builders',
  shortLocation: 'Al-Kabir Town Phase II, Lahore',
  fullAddress: 'C Block, Al-Kabir Town Phase II, Raiwind Road, Lahore',
  phoneDisplay: '0300 8540222',
  phoneCompact: '03008540222',
  whatsappDigits: '923004052270',
  officeHours: 'Monday – Saturday · 9:00 AM – 6:00 PM',
  logoPath:
    '/assets/aistudio/499545979_4917353778490356_1896659992253454332_n-removebg-preview_208b85a6.png',
};

export const JOB_ROLES: JobRole[] = [
  {
    id: 'client-relations-officer',
    indexLabel: '01.',
    title: 'Client Relations Officer',
    eligibilityNote: 'Male & Female Candidates',
    salary: 'Rs. 30,000 – 40,000',
    salaryDetail: '+ Performance Commission',
    jobType: 'Full-Time · Office-Based',
    location: 'C Block, Al-Kabir Town Phase II, Raiwind Road, Lahore',
    summary:
      'Represent HK Construction & Builders as the first point of contact for prospective residential and commercial clients—converting incoming inquiries into scheduled office consultations.',
    responsibilities: [
      'Attend incoming client calls, WhatsApp messages, and walk-in inquiries promptly.',
      'Manage and follow up on leads generated from social media advertisements.',
      'Communicate project scope, timelines, and company standards professionally.',
      'Arrange and coordinate physical client meetings with management at the office.',
    ],
    preferredExperience: [
      '1+ year of experience in client relations, real estate, construction sales, or tele-coordination.',
      'Confident, articulate communication in Urdu and working proficiency in English.',
      'Proven ability to track social media leads and maintain daily follow-up logs.',
    ],
    qualificationLabel: 'Primary Strength',
    qualificationOptions: [
      'Social Media Leads & WhatsApp Follow-Up',
      'Client Calls & Office Meeting Coordination',
      'Real Estate / Construction Client Advisory',
    ],
    summaryPlaceholder:
      'Briefly share your experience handling client calls, social media ad inquiries, or office meetings...',
  },
  {
    id: 'civil-engineer',
    indexLabel: '02.',
    title: 'Civil Engineer',
    eligibilityNote: 'Site Supervision & Execution',
    salary: 'Rs. 60,000 – 70,000',
    salaryDetail: 'Depending on Experience',
    jobType: 'Full-Time · Site & Office',
    location: 'C Block, Al-Kabir Town Phase II, Raiwind Road, Lahore',
    summary:
      'Lead on-site execution, quality control, and contractor supervision across active residential and commercial construction projects in Lahore.',
    responsibilities: [
      'Supervise daily on-site construction activities from excavation and grey structure to finishing.',
      'Verify steel reinforcement, concrete mix quality, brickwork, and alignment against architectural drawings.',
      'Coordinate labor teams, subcontractors, and material deliveries to meet project schedules.',
      'Prepare daily site progress updates, quantity estimates, and material requisitions.',
    ],
    preferredExperience: [
      'B.Sc. Civil Engineering or DAE Civil with hands-on site supervision experience in Lahore.',
      'Strong command over reading structural/architectural drawings and BOQ quantities.',
      'Experience managing residential or commercial grey structure and finishing works.',
    ],
    qualificationLabel: 'Engineering Qualification',
    qualificationOptions: [
      'B.Sc. Civil Engineering',
      'DAE Civil (3-Year Diploma)',
      'B.Tech Civil / Site Supervisor',
    ],
    summaryPlaceholder:
      'Mention your residential or commercial site projects, grey structure/finishing work, and team handling...',
  },
];
