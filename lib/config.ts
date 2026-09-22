// ─────────────────────────────────────────────────────────────
// EDIT THIS FILE. Every word on the site comes from here.
// ─────────────────────────────────────────────────────────────

export const config = {
  user: "aryan",
  host: "iitb",

  identity: {
    name: "Aryan Kumar",
    title: "Software Engineer",
    tagline: "Distributed systems, event pipelines, and the occasional Git clone.",
    location: "Bangalore, India",
    summary: [
      "Software Engineer at Loop Health. B.Tech from IIT Bombay with a minor in",
      "Machine Learning and Data Science.",
      "",
      "I build the parts other services depend on: a communications layer moving",
      "200K+ notifications a month, an event-driven biomarker pipeline on Pub/Sub",
      "and Temporal, a semantic retrieval layer over a 50K-relationship Neo4j graph.",
      "",
      "Before that, ad-tech ML — a TabNet propensity model on 10B+ impressions and",
      "a real-time bidding engine scoring 58K candidates at sub-4ms p99.",
    ],
  },

  contact: {
    email: "aryankr.iitb@gmail.com",
    phone: "+91 88097 58416",
    address: "Bangalore, Karnataka, India",
    // TODO: replace with your actual handles
    github: "https://github.com/aryankumar",
    linkedin: "https://linkedin.com/in/aryankumar",
    twitter: "",
    website: "",
  },

  resumeUrl: "/resume.pdf",

  experience: [
    {
      company: "Loop Health",
      role: "Software Engineer",
      period: "Jun 2026 — Present",
      location: "Bangalore, India",
      bullets: [
        "Designed a centralized communications service replacing per-service messaging code in 5 backends — providers behind a channel abstraction, per-channel retries, webhook-driven delivery-status reconciliation. 200K+ notifications/month over SMS, WhatsApp, email and Slack.",
        "Instrumented Datadog APM with custom spans and monitors across 3 services, cutting detection of silent Slack and WhatsApp delivery failures from hours to seconds via provider-level error-rate alerting.",
        "Architected Blood Intel, an event-driven biomarker pipeline on Pub/Sub processing 500 reports/day — a typed event registry decoupling publishers from subscribers, 6 stages as Temporal workflows with idempotent retries.",
        "Implemented a semantic retrieval layer over a Neo4j graph of 50K+ patient-biomarker relationships, resolving marker-condition paths into a constrained evidence set that bounds LLM output to retrieved facts.",
        "Built 2 onboarding flows as A/B variants on a config-driven state-machine engine (Spring Boot / jOOQ) for 1,200 companies, driving transitions server-side and aggregating 10+ internal services into SDUI payloads.",
        "Shipped the 20 corresponding React Native screens across iOS and Android, bridging native permission APIs and committing state on OS-dialog dismissal so users returning from Settings resume on the correct step.",
        "Resolved 15+ production incidents on-call across distributed microservices, authoring RCAs adopted as team references.",
      ],
      stack: ["Spring Boot", "jOOQ", "Pub/Sub", "Temporal.io", "Neo4j", "React Native", "Datadog", "GCP"],
    },
    {
      company: "Mobavenue Media",
      role: "ML Intern · Founder's Office",
      period: "Feb 2025 — Aug 2025",
      location: "Mumbai, India",
      bullets: [
        "Built and deployed a TabNet install/purchase propensity pipeline trained on 10B+ production ad impressions — 85% recall on installs, 70% on purchases against heavily imbalanced conversion labels, lifting expected ROAS.",
        "Owned the core bidding engine end to end, fusing user propensity scores, inventory tiering and hourly pacing signals into one scoring path. Cut bid spend 18% with no loss in conversion volume.",
        "Shipped a real-time scoring service narrowing a 58K candidate pool to the 8K highest-value placements per request at sub-4ms p99 under live bidding traffic.",
      ],
      stack: ["Python", "PyTorch", "TabNet", "Kafka", "Redis"],
    },
  ],

  projects: [
    {
      name: "uGit — Git From Scratch in Java",
      period: "Apr 2026 — May 2026",
      blurb:
        "Git plumbing reimplemented in dependency-free Java: init, add, commit, branch, checkout, log, with full ref resolution. A SHA-1 content-addressable store persists zlib-deflated blobs, trees and commits as an immutable DAG. The staging index diffs the working tree against HEAD by hash comparison, so it never reads full contents.",
      stack: ["Java", "SHA-1", "zlib"],
      url: "https://github.com/aryankumar/ugit",
    },
    {
      name: "JPEG-like Image Compression Engine",
      period: "Feb 2025 — Apr 2025",
      blurb:
        "A JPEG compression pipeline built from scratch — 8×8 DCT, quantization, entropy coding. Tuned the quality factor for 80% compression while holding degradation under 5% PSNR loss. Course project under Prof. Ajit Rajwade.",
      stack: ["Python", "DCT", "Entropy coding"],
      url: "",
    },
    {
      name: "Satellite Image Segmentation & Change Detection",
      period: "Nov 2023 — Dec 2023",
      blurb:
        "A U-Net CNN segmenting satellite imagery and detecting temporal change at 92% accuracy, extended into a scalable change-detection framework proposed for ISRO's cross-border monitoring pipeline. Built for ISRO at the Smart India Hackathon.",
      stack: ["PyTorch", "U-Net", "CNN"],
      url: "",
    },
  ],

  achievements: [
    { year: "2023", text: "Ranked 5th nationally at Smart India Hackathon among 200+ finalists — one of only 3 IIT Bombay teams recognised by the Ministry of Education." },
    { year: "2026", text: "Change-detection framework proposed for ISRO's cross-border monitoring pipeline." },
    { year: "2026", text: "B.Tech, IIT Bombay — CPI 8.23/10, with a Minor in Machine Learning and Data Science." },
    { year: "2026", text: "RCAs from 15+ on-call production incidents adopted as team-wide references at Loop Health." },
  ],

  education: [
    {
      school: "Indian Institute of Technology, Bombay",
      degree: "B.Tech · Minor in Machine Learning and Data Science",
      period: "Oct 2022 — May 2026",
      detail: "CPI 8.23/10 · Mumbai, India",
    },
  ],

  skills: {
    Languages: ["C/C++", "Java", "Python", "SQL", "JavaScript/TypeScript"],
    Backend: ["Spring Boot", "Node.js", "REST", "GraphQL", "WebSockets", "Pub/Sub", "Temporal.io"],
    "Cloud & Infra": ["GCP", "AWS", "Kubernetes", "Docker", "Terraform", "Linux", "CI/CD", "Kafka"],
    Databases: ["PostgreSQL", "MySQL", "MongoDB", "Neo4j", "Redis", "SQLite"],
    "AI / ML": ["RAG", "Knowledge graphs", "Agentic pipelines", "LangChain", "HuggingFace", "PyTorch"],
    Observability: ["Datadog", "Sentry", "LangSmith", "Postman", "DBeaver"],
    Coursework: ["DSA", "Operating Systems", "Computer Networks", "DBMS", "OOP", "System Design", "Discrete Maths"],
  },

  // Shown by `neofetch`
  facts: {
    Host: "IIT Bombay",
    Kernel: "Spring Boot / Node.js",
    Uptime: "since Oct 2022",
    Packages: "Pub/Sub, Temporal, Neo4j",
    Shell: "zsh",
    Editor: "neovim",
  },
} as const;

export type Config = typeof config;
