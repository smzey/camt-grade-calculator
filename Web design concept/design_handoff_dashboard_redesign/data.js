// data.js — CAMT Grade Calculator mock catalog, transcribed from sql/seed.sql
// (groups, subjects, grades). Used to give the redesign concepts real, faithful
// content instead of placeholder text.

export const GROUPS = [
  {
    "code": 1000,
    "name": "General Education",
    "parent": null,
    "reqWil": 30,
    "reqIs": 30
  },
  {
    "code": 1100,
    "name": "General Education - Required",
    "parent": 1000,
    "reqWil": 21,
    "reqIs": 21
  },
  {
    "code": 1110,
    "name": "Learner Person",
    "parent": 1100,
    "reqWil": 15,
    "reqIs": 15
  },
  {
    "code": 1111,
    "name": "English 4",
    "parent": 1110,
    "reqWil": 3,
    "reqIs": 3
  },
  {
    "code": 1112,
    "name": "Learner Person - Selected",
    "parent": 1110,
    "reqWil": 3,
    "reqIs": 3
  },
  {
    "code": 1120,
    "name": "Innovative Co-creator",
    "parent": 1100,
    "reqWil": 3,
    "reqIs": 3
  },
  {
    "code": 1130,
    "name": "Active Citizen",
    "parent": 1100,
    "reqWil": 3,
    "reqIs": 3
  },
  {
    "code": 1200,
    "name": "General Education - Elective",
    "parent": 1000,
    "reqWil": 9,
    "reqIs": 9
  },
  {
    "code": 1210,
    "name": "Learner Person",
    "parent": 1200,
    "reqWil": 0,
    "reqIs": 0
  },
  {
    "code": 1220,
    "name": "Active Citizen",
    "parent": 1200,
    "reqWil": 0,
    "reqIs": 0
  },
  {
    "code": 1230,
    "name": "Innovative Co-creator",
    "parent": 1200,
    "reqWil": 0,
    "reqIs": 0
  },
  {
    "code": 2000,
    "name": "Field of Specialization",
    "parent": null,
    "reqWil": 90,
    "reqIs": 90
  },
  {
    "code": 2100,
    "name": "Core Courses",
    "parent": 2000,
    "reqWil": 33,
    "reqIs": 33
  },
  {
    "code": 2110,
    "name": "208262 or 954241",
    "parent": 2100,
    "reqWil": 3,
    "reqIs": 3
  },
  {
    "code": 2120,
    "name": "Others",
    "parent": 2100,
    "reqWil": 30,
    "reqIs": 30
  },
  {
    "code": 2200,
    "name": "Major Courses ",
    "parent": 2000,
    "reqWil": 57,
    "reqIs": 57
  },
  {
    "code": 2210,
    "name": "Major Required Courses",
    "parent": 2200,
    "reqWil": 39,
    "reqIs": 33
  },
  {
    "code": 2220,
    "name": "Major Electives",
    "parent": 2200,
    "reqWil": 18,
    "reqIs": 24
  },
  {
    "code": 9000,
    "name": "Free Electives",
    "parent": null,
    "reqWil": 6,
    "reqIs": 6
  }
];

export const SUBJECTS = [
  {
    "code": ">=30"
  },
  {
    "code": ">=21"
  },
  {
    "code": ">=15"
  },
  {
    "code": "001101",
    "name": "Fundamental English 1",
    "isTitle": false,
    "credit": 3,
    "group": 1110,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "001102",
    "name": "Fundamental English 2",
    "isTitle": false,
    "credit": 3,
    "group": 1110,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "001201",
    "name": "Critical Reading and Effective Writing",
    "isTitle": false,
    "credit": 3,
    "group": 1110,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=3"
  },
  {
    "code": "001202",
    "name": "English in Professional Contexts",
    "isTitle": false,
    "credit": 3,
    "group": 1111,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "001229",
    "name": "English for Media Arts",
    "isTitle": false,
    "credit": 3,
    "group": 1111,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=3"
  },
  {
    "code": "204100",
    "name": "Information Technology and Modern Life",
    "isTitle": false,
    "credit": 3,
    "group": 1112,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "953111",
    "name": "Software for Everyday Life",
    "isTitle": false,
    "credit": 3,
    "group": 1112,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=3"
  },
  {
    "code": "011151",
    "name": "Reasoning",
    "isTitle": false,
    "credit": 3,
    "group": 1120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "013110",
    "name": "Psychology and Daily Life",
    "isTitle": false,
    "credit": 3,
    "group": 1120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "159100",
    "name": "Modern World in Everyday Life",
    "isTitle": false,
    "credit": 3,
    "group": 1120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "703103",
    "name": "Introduction to Entrepreneurship and Business",
    "isTitle": false,
    "credit": 3,
    "group": 1120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=3"
  },
  {
    "code": "140104",
    "name": "Citizenship",
    "isTitle": false,
    "credit": 3,
    "group": 1130,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=9"
  },
  {
    "code": ">=0"
  },
  {
    "code": "009103",
    "name": "Information Leteracy and Information Presentation",
    "isTitle": false,
    "credit": 3,
    "group": 1210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "011269",
    "name": "Philosophy of Sufficiency Economy",
    "isTitle": false,
    "credit": 3,
    "group": 1210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "057122",
    "name": "Swimming for Life and Exercise",
    "isTitle": false,
    "credit": 1,
    "group": 1210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "057127",
    "name": "Badminton for Life and Exercise",
    "isTitle": false,
    "credit": 1,
    "group": 1210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "176104",
    "name": "Rights and Duties of Citizen in Digital Age",
    "isTitle": false,
    "credit": 3,
    "group": 1210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "702101",
    "name": "Finance for Daily Life",
    "isTitle": false,
    "credit": 3,
    "group": 1210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "851100",
    "name": "Introduction to Communication",
    "isTitle": false,
    "credit": 3,
    "group": 1210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "888102",
    "name": "Big Data for Business",
    "isTitle": false,
    "credit": 3,
    "group": 1210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=0"
  },
  {
    "code": "050113",
    "name": "Locality in Globalization",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "103271",
    "name": "Music Appreciation",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "109100",
    "name": "Man and Art",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "109115",
    "name": "Life and Aesthetics",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "127100",
    "name": "Politics in Everyday Life",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "154100",
    "name": "Introduction to Geography",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "154104",
    "name": "Environmental Conservation",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "159151",
    "name": "Lanna Society and Culture",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "201192",
    "name": "Doi Suthep Study",
    "isTitle": false,
    "credit": 1,
    "group": 1220,
    "gradeType": "SU",
    "plan": null
  },
  {
    "code": "357110",
    "name": "Insects and Mankind",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "602102",
    "name": "Life and Alternative Energy",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "951100",
    "name": "Modern Life and Animation",
    "isTitle": false,
    "credit": 3,
    "group": 1220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=0"
  },
  {
    "code": "012173",
    "name": "Descriptive Study of Religion",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "050104",
    "name": "Man and the Modern World",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "176100",
    "name": "Law and Modern World",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "201116",
    "name": "Science and Global Warming",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "201190",
    "name": "Critical Thinking, Problem Solving and Science Communication",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "204123",
    "name": "Introduction to Data Science",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "368100",
    "name": "Starting an Agribusiness in a Changing World",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "603200",
    "name": "Packaging in Daily Life",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "610112",
    "name": "Food Product Innovation",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "888107",
    "name": "Business Startup on Digital Platform",
    "isTitle": false,
    "credit": 3,
    "group": 1230,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=90"
  },
  {
    "code": ">=33"
  },
  {
    "code": ">=3"
  },
  {
    "code": "208262",
    "name": "Elementary Statistics for Science and Technology",
    "isTitle": false,
    "credit": 3,
    "group": 2110,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954241",
    "name": "Art of Computing",
    "isTitle": false,
    "credit": 3,
    "group": 2110,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=30"
  },
  {
    "code": "954100",
    "name": "Information System for Organization Management",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954140",
    "name": "Information Technology Literacy",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954142",
    "name": "Fundamental Computer Programming for Modern Management",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954143",
    "name": "Data Management",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954170",
    "name": "Elementary Business Process Modeling",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954230",
    "name": "Financial Tracking in Digital Business",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954231",
    "name": "Human Capital Management in Digital Business",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954244",
    "name": "System Analysis and Design for Modern Management",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954246",
    "name": "Advanced Computer Programming for Modern Management",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954248",
    "name": "Information and Communication Technology",
    "isTitle": false,
    "credit": 3,
    "group": 2120,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=57"
  },
  {
    "code": "v-- PLEASE SELECT PLAN"
  },
  {
    "code": "954310",
    "name": "Information Systems for Enterprise Resource Planning",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954340",
    "name": "Enterprise Database Design and Applications",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954346",
    "name": "Application Development for Business Sector",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954365",
    "name": "Knowledge Management System",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954370",
    "name": "Analysis and Design in Materials Management Module",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954374",
    "name": "Sales and Distribution for Digital Market",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954381",
    "name": "Preparation for Work Integrated Learning",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "SU",
    "plan": null
  },
  {
    "code": "954389",
    "name": "Job Training",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "SU",
    "plan": "IS"
  },
  {
    "code": "954416",
    "name": "Information Systems for Supply Chain and Customer Relationship Management",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "944490",
    "name": "Informatics Research Methodology",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954484",
    "name": "Work Integrated Learning 1",
    "isTitle": false,
    "credit": 6,
    "group": 2210,
    "gradeType": "SU",
    "plan": "WIL"
  },
  {
    "code": "954485",
    "name": "Work Integrated Learning 2",
    "isTitle": false,
    "credit": 6,
    "group": 2210,
    "gradeType": "SU",
    "plan": "WIL"
  },
  {
    "code": "954499",
    "name": "Independent Study",
    "isTitle": false,
    "credit": 3,
    "group": 2210,
    "gradeType": "SU",
    "plan": "IS"
  },
  {
    "code": "v-- PLEASE SELECT PLAN"
  },
  {
    "code": "954316",
    "name": "Technology Application in Supply Chain",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954321",
    "name": "Operations and Service for E-Service",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954322",
    "name": "Technology in Call Center Management",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954324",
    "name": "Information and Communication Technology for E-Tourism",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954326",
    "name": "Information Technology in Event Management",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954344",
    "name": "Computer Networks and Database Security for Organization",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954347",
    "name": "E-Commerce",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954348",
    "name": "Web Programming",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954371",
    "name": "Analysis and Design in Production Planning Module",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954375",
    "name": "Analysis and Design in Enterprise Asset and Customer Service",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954410",
    "name": "Information Technology Application in Lean Transformation",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954411",
    "name": "Using Information Technology to Develop Key Performance Indicators for Business",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954412",
    "name": "Industrial Excellence Model",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954413",
    "name": "Decision Making in Information Technology Investment and Organizational Management",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954414",
    "name": "Preliminary Simulations on Logistics Activities",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954415",
    "name": "Introduction to Quantitative Business Problems Analysis",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954417",
    "name": "Information System for Maintenance",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954421",
    "name": "Mobile Device in Business Operation",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954422",
    "name": "Customer Relationship Management and Supplier Relationship Management in E-Tourism",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954423",
    "name": "Service Innovation for Competitiveness",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954424",
    "name": "Introduction to E-Tourism business",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954425",
    "name": "Marketing Analytics in Hospitality and Tourism Industry",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954426",
    "name": "Introduction to E-Service",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954430",
    "name": "Digital Business Ecosystem",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954433",
    "name": "Service and Operation in E-Tourism",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954440",
    "name": "Enterprise Portal Application Development",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954442",
    "name": "Cloud Computing",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954443",
    "name": "Multimedia for Digital Business",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954444",
    "name": "ERP Programming",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954445",
    "name": "Healthcare Information Systems",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954447",
    "name": "Client -Side Scripting",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954448",
    "name": "Web Service for Enterprise Systems",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954449",
    "name": "Rapid Application Development",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954461",
    "name": "Information Technology for Knowledge Creation",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954462",
    "name": "Knowledge Engineering and Information Technology Application",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954463",
    "name": "Information Technology for Learning Organization",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954464",
    "name": "Information Technology for Knowledge Worker Management",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954466",
    "name": "Digital Business and Service Psychology",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954467",
    "name": "Research Development for Workforce in a Digital Age",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954468",
    "name": "Introduction to Intellectual Capital Management",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954471",
    "name": "Business Data Mining",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954472",
    "name": "Business Data Visualization",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954473",
    "name": "Enterprise Resource Planning Configuration",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954474",
    "name": "Digital Data Gathering",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954477",
    "name": "Information Technology for Production System",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954491",
    "name": "Selected Topics in Modern Management and Information Technology",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954494",
    "name": "Selected Topics in Work Integrated Learning 1",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954495",
    "name": "Selected Topics in Work Integrated Learning 2",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954496",
    "name": "Selected Topics in Work Integrated Learning 3",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": "954497",
    "name": "Selected Topics in Work Integrated Learning 4",
    "isTitle": false,
    "credit": 3,
    "group": 2220,
    "gradeType": "AF",
    "plan": null
  },
  {
    "code": ">=6"
  },
  {
    "code": "FREE-01",
    "name": "Free Elective 1 credit",
    "isTitle": false,
    "credit": 1,
    "group": 9000,
    "gradeType": null,
    "plan": null
  },
  {
    "code": "FREE-02",
    "name": "Free Elective 2 credits",
    "isTitle": false,
    "credit": 2,
    "group": 9000,
    "gradeType": null,
    "plan": null
  },
  {
    "code": "FREE-03",
    "name": "Free Elective 3 credits",
    "isTitle": false,
    "credit": 3,
    "group": 9000,
    "gradeType": null,
    "plan": null
  },
  {
    "code": "FREE-04",
    "name": "Free Elective 4 credits",
    "isTitle": false,
    "credit": 4,
    "group": 9000,
    "gradeType": null,
    "plan": null
  },
  {
    "code": "FREE-05",
    "name": "Free Elective 5 credits",
    "isTitle": false,
    "credit": 5,
    "group": 9000,
    "gradeType": null,
    "plan": null
  },
  {
    "code": "FREE-06",
    "name": "Free Elective 6 credits",
    "isTitle": false,
    "credit": 6,
    "group": 9000,
    "gradeType": null,
    "plan": null
  }
];

export const GRADES = [
  {
    "grade": "A",
    "point": 4,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": false
  },
  {
    "grade": "B",
    "point": 3,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": false
  },
  {
    "grade": "B+",
    "point": 3.5,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": false
  },
  {
    "grade": "C",
    "point": 2,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": false
  },
  {
    "grade": "C+",
    "point": 2.5,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": false
  },
  {
    "grade": "D",
    "point": 1,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": false
  },
  {
    "grade": "D+",
    "point": 1.5,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": false
  },
  {
    "grade": "F",
    "point": 0,
    "type": "AF",
    "isCal": true,
    "isKeep": false,
    "isPlanning": false
  },
  {
    "grade": "S",
    "point": null,
    "type": "SU",
    "isCal": false,
    "isKeep": true,
    "isPlanning": false
  },
  {
    "grade": "U",
    "point": null,
    "type": "SU",
    "isCal": false,
    "isKeep": false,
    "isPlanning": false
  },
  {
    "grade": "V",
    "point": null,
    "type": null,
    "isCal": false,
    "isKeep": false,
    "isPlanning": false
  },
  {
    "grade": "W",
    "point": null,
    "type": null,
    "isCal": false,
    "isKeep": false,
    "isPlanning": false
  },
  {
    "grade": "X",
    "point": null,
    "type": null,
    "isCal": false,
    "isKeep": true,
    "isPlanning": false
  },
  {
    "grade": "xA",
    "point": 4,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": true
  },
  {
    "grade": "xB",
    "point": 3,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": true
  },
  {
    "grade": "xB+",
    "point": 3.5,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": true
  },
  {
    "grade": "xC",
    "point": 2,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": true
  },
  {
    "grade": "xC+",
    "point": 2.5,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": true
  },
  {
    "grade": "xD",
    "point": 1,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": true
  },
  {
    "grade": "xD+",
    "point": 1.5,
    "type": "AF",
    "isCal": true,
    "isKeep": true,
    "isPlanning": true
  },
  {
    "grade": "xF",
    "point": 0,
    "type": "AF",
    "isCal": true,
    "isKeep": false,
    "isPlanning": true
  },
  {
    "grade": "xS",
    "point": null,
    "type": "SU",
    "isCal": false,
    "isKeep": true,
    "isPlanning": true
  },
  {
    "grade": "xU",
    "point": null,
    "type": "SU",
    "isCal": false,
    "isKeep": false,
    "isPlanning": true
  }
];

export function childrenOf(code) {
  return GROUPS.filter(g => g.parent === code);
}

export function topGroups() {
  return GROUPS.filter(g => g.parent === null);
}

export function subjectsForGroup(code) {
  return SUBJECTS.filter(s => s.group === code);
}

// All descendant group codes (including self) — for rolling up credit totals.
export function subtreeGroupCodes(code) {
  const out = [code];
  for (const child of childrenOf(code)) {
    out.push(...subtreeGroupCodes(child.code));
  }
  return out;
}

// Sum of credits earned (is_keep grades) across a group's whole subtree.
export function creditsEarned(code, enrollments) {
  const codes = new Set(subtreeGroupCodes(code));
  let sum = 0;
  for (const s of SUBJECTS) {
    if (!codes.has(s.group)) continue;
    const enr = enrollments[s.code];
    if (!enr) continue;
    const g = GRADES.find(gr => gr.grade === enr.grade);
    if (g && g.isKeep) sum += s.credit;
  }
  return sum;
}

export function requiredFor(code, plan) {
  const g = GROUPS.find(gr => gr.code === code);
  if (!g) return 0;
  return plan === 'IS' ? g.reqIs : g.reqWil;
}

export function gpaFor(enrollments, { includePlanning } = {}) {
  let pointsSum = 0, creditSum = 0;
  for (const s of SUBJECTS) {
    const enr = enrollments[s.code];
    if (!enr) continue;
    const g = GRADES.find(gr => gr.grade === enr.grade);
    if (!g || !g.isCal) continue;
    if (g.isPlanning && !includePlanning) continue;
    if (g.point == null) continue;
    pointsSum += g.point * s.credit;
    creditSum += s.credit;
  }
  return { gpa: creditSum > 0 ? pointsSum / creditSum : null, credits: creditSum };
}
