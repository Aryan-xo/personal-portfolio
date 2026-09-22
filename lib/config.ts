// ─────────────────────────────────────────────────────────────
// EDIT THIS FILE. Every word on the site comes from here.
// ─────────────────────────────────────────────────────────────

export const config = {
  user: "aryan",
  host: "iitb",

  identity: {
    name: "Aryan Kumar",
    title: "Software Engineer",
    tagline: "Distributed systems, ML pipelines, and the occasional Git clone.",
    location: "Bangalore, India",
    summary: [
      "Software Engineer at Loop Health. B.Tech in Metallurgical Engineering and",
      "Materials Science from IIT Bombay, with a Minor in Artificial Intelligence",
      "and Data Science.",
      "",
      "I build the parts other services depend on — a communications layer moving",
      "200K+ notifications a month, an event-driven biomarker pipeline on Pub/Sub",
      "and Temporal, a semantic retrieval layer over a 50K-relationship Neo4j graph.",
      "",
      "Before that: ad-tech ML at Mobavenue, equity strategy at PhillipCapital, NLP",
      "research at CustomersShastra, and supercapacitor R&D at Toyota Technological",
      "Institute in Japan. CFA Level 1 candidate.",
      "",
      "Type `experience`, `projects`, `research` or `leadership` to dig in.",
    ],
  },

  contact: {
    email: "aryankr.iitb@gmail.com",
    phone: "+91 88097 58416",
    address: "Bangalore, Karnataka, India",
    github: "https://github.com/Aryan-xo",
    linkedin: "https://www.linkedin.com/in/aryankriitb/",
    leetcode: "https://leetcode.com/u/aryan_x0/",
    twitter: "",
    website: "",
  },

  resumeUrl: "/resume.pdf",
  resumeFullUrl: "/resume-full.pdf", // the longer academic CV

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
      role: "Data Science Intern",
      period: "Feb 2025 — Aug 2025",
      location: "Mumbai, India",
      note: "Ad-tech firm specializing in data-driven marketing and programmatic advertising. Recognised with an LOR by the Co-founder.",
      bullets: [
        "Achieved 85% recall on installs and 70% on purchases with TabNet across 10B+ impressions, boosting ROAS.",
        "Identified 8K+ top inventories from a 58K+ pool, enabling targeted and cost-efficient ad bid placement at <4ms latency.",
        "Reduced bidding costs 18% by redesigning the scoring formula with user scores, inventory tiers and hourly pacing trends.",
      ],
      stack: ["Python", "PyTorch", "TabNet", "Kafka", "Redis"],
    },
    {
      company: "PhillipCapital India",
      role: "Strategy Intern",
      period: "May 2025 — Jul 2025",
      location: "India",
      note: "Received a Letter of Recommendation from the CEO for exceptional contributions and high-impact results.",
      bullets: [
        "Studied 15+ firms and identified 20+ gaps, proposing solutions to the VP targeting a $10-12B market potential by FY2030.",
        "Targeted 500K+ users by proposing P9 Lite — discount brokerage and global investing without cannibalizing P9 users.",
        "Secured C-Suite approval through board presentations, leading to launch and high-volume revenue streams.",
      ],
      stack: ["Market research", "Financial modelling", "Product strategy"],
    },
    {
      company: "CustomersShastra",
      role: "ML Research Intern",
      period: "May 2024 — Jul 2024",
      location: "India",
      bullets: [
        "Boosted prioritization efficiency 80% with a spaCy-EN model scoring product feedback, accelerating decision-making.",
        "Reduced review cycles from 720 hours to seconds across 10K+ feedback cases by creating 40+ high-impact NLP features.",
        "Automated customer-agent email audits, enabling quality checks on 2K+ emails/month and a 46% boost in compliance.",
      ],
      stack: ["Python", "spaCy", "NLP"],
    },
  ],

  research: [
    {
      lab: "Toyota Technological Institute, Japan",
      role: "Research Intern",
      period: "May 2024 — Jul 2024",
      advisor: "Prof. Masamichi Yoshimura",
      note: "Received an LOR for supercapacitor/CNT R&D in a 3-month, 5+ country, 30+ researcher lab. Awarded a competitive Research Internship Award of ¥196,000.",
      approach: [
        "Developed electrode fabrication after reviewing 20+ academic papers on supercapacitor performance.",
        "Automated data processing using 10+ Python libraries, boosting efficiency by removing redundant tasks.",
        "Designed nano-petal Ni-Foam/Co/Mo/Ni electrodes with controlled synthesis time and concentration.",
      ],
      result: [
        "Achieved a specific capacitance of 837 F/g — 4.65× the industry standard — influencing future R&D planning.",
        "Reduced data handling time by 90%, enabling faster experiment turnaround and decision-making.",
        "Doubled deposition density and produced 5 µm nano-petals by extending synthesis from 8 hrs to 24 hrs.",
      ],
    },
  ],

  projects: [
    {
      name: "uGit — Git From Scratch in Java",
      period: "Apr 2026 — May 2026",
      tag: "Self-project",
      blurb:
        "Git plumbing reimplemented in dependency-free Java: init, add, commit, branch, checkout, log, with full ref resolution. A SHA-1 content-addressable store persists zlib-deflated blobs, trees and commits as an immutable DAG. The staging index diffs the working tree against HEAD by hash comparison, so it never reads full contents.",
      stack: ["Java", "SHA-1", "zlib"],
      url: "https://github.com/Aryan-xo",
    },
    {
      name: "Satellite Image Segmentation & Change Detection",
      period: "Nov 2023 — Dec 2023",
      tag: "ISRO · Smart India Hackathon",
      blurb:
        "Ranked 5th nationally among 200+ finalists, one of only 3 IIT Bombay teams recognised by the Ministry of Education. Led a team of 6 to build a 41-layer U-Net CNN reaching 92% accuracy on 20K+ images via pixel-wise semantic segmentation, benchmarked against a review of 10+ geospatial models. Extended into a scalable change-detection framework recognised by ISRO for monitoring 1100+ border villages.",
      stack: ["PyTorch", "U-Net", "CNN"],
      url: "",
    },
    {
      name: "NeuroMapping — AI for Early Neurodiversity Detection",
      period: "Jul 2025 — Present",
      tag: "Course project · DH307",
      blurb:
        "An AI/ML diagnostic tool detecting neurodiverse conditions affecting 15-20% of the global population, targeting >90% accuracy. Designing analytics pipelines to process 10K+ patient records on dyslexia, ADHD, dyspraxia and autism for model training and validation.",
      stack: ["Python", "scikit-learn", "Pandas"],
      url: "",
    },
    {
      name: "Real-Time Order Book Scraping & Automated Trading",
      period: "Feb 2025 — Jul 2025",
      tag: "Freelance",
      blurb:
        "A high-frequency real-time bid-ask order scraper with a GUI using PyTesseract, processing 10+ screen regions at <2ms latency. Developed and backtested 15+ trading strategies against 100K+ simulated trades on large-scale order book data. Automated trade execution delivered 4% higher returns on TATA Motors while cutting manual monitoring overhead 95%.",
      stack: ["Python", "PyTesseract", "OpenCV"],
      url: "",
    },
    {
      name: "Algorithm Visualizer",
      period: "Jun 2025 — Jul 2025",
      tag: "Learner's Space, IIT Bombay",
      blurb:
        "Pathfinding algorithms (DFS, BFS, Dijkstra, A*) implemented in C++ and integrated into a React visualization tool. A responsive web app with React-enabled visualization, automated and manual maze generation, and adjustable speed controls, plus interactive animations built with JavaScript and React Hooks to demonstrate real-time algorithmic decision-making.",
      stack: ["C++", "React", "JavaScript"],
      url: "",
    },
    {
      name: "Handwritten Character Recognition Using Neural Nets",
      period: "Dec 2023 — Jan 2024",
      tag: "WiDS · Analytics Club, IIT Bombay",
      blurb:
        "A neural network engineered from scratch for image-based handwritten digit and text recognition with real-time GUI integration. 96% accuracy over 15 epochs from a 3-layer deep network using NumPy on EMNIST. Stochastic gradient descent with mini-batches of 128 accelerated convergence 25%. An OpenCV drawing GUI gave real-time predictions, used by 20+ people during validation.",
      stack: ["NumPy", "OpenCV", "EMNIST"],
      url: "",
    },
    {
      name: "Text-to-Speech via Gaussian Diffusion Models",
      period: "Oct 2024 — Nov 2024",
      tag: "Self-project",
      blurb:
        "A transformer encoder with windowed self-attention and feedforward layers improving phoneme-to-representation mapping. Probabilistic diffusion models gradually enhance pure noise into target audio from input text by solving a time-reversed SDE. Validated through spectrogram similarity and listening tests, showing noticeable improvement over baseline TTS models.",
      stack: ["PyTorch", "Transformers", "Diffusion"],
      url: "",
    },
    {
      name: "Real-Time Social Distancing Monitoring System",
      period: "Sep 2022 — Nov 2022",
      tag: "Computer vision · Self-project",
      blurb:
        "A Python-based system using OpenCV, YOLO and SciPy to detect and track people in real time for social distancing compliance. The Euclidean distance algorithm measures inter-person spacing with high accuracy and triggers visual alerts on violations. Video I/O pipelines with live overlays and auto-recording of flagged events cut manual surveillance effort 40%.",
      stack: ["OpenCV", "YOLO", "SciPy"],
      url: "",
    },
    {
      name: "JPEG-like Image Compression Engine",
      period: "Feb 2025 — Apr 2025",
      tag: "Course project · Guide: Prof. Ajit Rajwade",
      blurb:
        "A JPEG compression pipeline built from scratch — 8×8 DCT, quantization, entropy coding. Tuned the quality factor for 80% compression while holding degradation under 5% PSNR loss.",
      stack: ["Python", "DCT", "Entropy coding"],
      url: "",
    },
    {
      name: "Multi-Level Thresholding via Kittler-Illingworth",
      period: "Jan 2025 — Apr 2025",
      tag: "Course project",
      blurb:
        "Poisson-based Kittler-Illingworth thresholding segmenting images at 0.86 correlation and 0.82 JS divergence. Integrated a GMM into the framework for multi-thresholding, computing 4 optimal thresholds to classify pixels into 5 regions. Validated for robustness on noisy, non-Gaussian datasets using good region uniformity (2113.7) and second-order entropy (1.338).",
      stack: ["Python", "GMM", "Image processing"],
      url: "",
    },
    {
      name: "Architectural Layout Classification",
      period: "Jan 2024 — Apr 2024",
      tag: "Course project · DS203",
      blurb:
        "Improved design retrieval speed 30% by classifying 10000+ building layouts into 8 complexity clusters using GridSearchCV hyper-tuning. An image processing model with Canny edge detection and contour-based feature extraction quantifies layout complexity, feeding a searchable database for rapid retrieval and comparison.",
      stack: ["scikit-learn", "OpenCV", "GridSearchCV"],
      url: "",
    },
  ],

  finance: [
    {
      name: "Corporate Finance",
      period: "Jun 2025 — Aug 2025",
      tag: "Finance Club, IIT Bombay",
      bullets: [
        "Built a detailed DCF valuation model for sugar sector firms, incorporating WACC, M&A scenarios and sensitivity analyses.",
        "Optimized capital structure, reducing WACC 2% and driving a projected 10% improvement in ROI through debt-equity rebalancing.",
        "Leveraged NPV and IRR analysis to optimize investment decisions — 15% higher liquidity and 20% improved profitability.",
      ],
    },
    {
      name: "Summer of Quant",
      period: "May 2025 — Jul 2025",
      tag: "Quant Community · Institute Technical Council, IIT Bombay",
      bullets: [
        "Completed an 8-week intensive quantitative finance bootcamp covering time series analysis, probability and financial derivatives.",
        "Developed and trained an LSTM-based stock forecasting model — 92% directional accuracy, 1.85 RMSE on historical data.",
      ],
    },
    {
      name: "Options Pricing",
      period: "Jun 2024 — Aug 2024",
      tag: "Fin-Search, Finance Club, IIT Bombay",
      bullets: [
        "70.18% accuracy on Bank Nifty Call Options (14-day expiry) using Python-based Black-Scholes integrating 4 option greeks.",
        "81% accuracy with a sequential ANN leveraging option chain data to enhance pricing insights for traders.",
      ],
    },
    {
      name: "Financial Modeling",
      period: "Jan 2024 — Feb 2024",
      tag: "Finance Club, IIT Bombay",
      bullets: [
        "Performed DCF models to evaluate receivables and payables for a firm's cash flows and assess financial health.",
        "Mitigated interest rate risk via a structured swap agreement, hedging against adverse market movements.",
        "Developed a swap pricer using no-arbitrage and bootstrapping principles, achieving <0.5% valuation error.",
      ],
    },
  ],

  leadership: [
    {
      role: "Manager, Innovation Council",
      org: "IIT Bombay · Ministry of Education",
      period: "Oct 2024 — May 2025",
      note: "Strengthening IITB's entrepreneurship and innovation ecosystem to drive toward top NIRF ranking by 2026.",
      bullets: [
        "Initiated 5+ nationwide innovation competitions and developed a newsletter showcasing IITB's achievements.",
        "Procured INR 2M+ in grants and spearheaded pitches to 8 corporate leaders, fostering international partnerships.",
        "Amplified social media engagement and website traffic 40% across 3 platforms, reaching a 10K+ global audience.",
      ],
    },
    {
      role: "Department Alumni Secretary",
      org: "Student Alumni Relations Cell, IIT Bombay",
      period: "Jun 2023 — Mar 2024",
      note: "Represented MEMS as part of a 15-member team fostering relations between 60K+ alumni and 12K+ students.",
      bullets: [
        "Procured 80+ student internships by contacting IITB alumni under ILP, improving their professional experience.",
        "Connected 650+ students and 300+ mentors through the Placement Mentoring Program with SARC for career support.",
        "Executed SARCathon competitions at PAN-IIT level, engaging 500+ participants with prizes worth 0.2M+.",
      ],
    },
  ],

  achievements: [
    { year: "2022", text: "JEE Mains — 98.70 percentile among 1.1M+ students." },
    { year: "2022", text: "WBJEE — Secured AIR 773 out of 0.1M+ candidates." },
    { year: "2023", text: "Ranked 5th nationally at Smart India Hackathon among 200+ finalists — one of only 3 IIT Bombay teams recognised by the Ministry of Education." },
    { year: "2024", text: "Research Internship Award of ¥196,000 for a summer internship in Japan — a prestigious competitive award." },
    { year: "2025", text: "Institute Rank 5th — ResCon, TechConnect Research Poster Presentation Competition, 50+ teams." },
    { year: "2025", text: "Institute Rank Top 15 — Portfolio Management Competition arranged by the Finance Club, 150+ teams." },
    { year: "2024", text: "Institute Rank 4th — HULT Prize, IIT Bombay, 60+ teams." },
    { year: "2020", text: "Selected in Magadh Super 30 out of 10K+ aspirants." },
    { year: "2025", text: "Secured top AA/AB grades across 21 courses (2022-25)." },
    { year: "2024", text: "Taught 50+ underprivileged students in STEM, leading hands-on experiments and creating tailored question sets." },
    { year: "2024", text: "Hosted the SARC exam series and a UPSC CSE 2020 AIR 1 & 110 panel discussion, engaging 200+ participants." },
  ],

  certifications: [
    "CFA Level 1 Candidate (Aug 2025), USA",
    "33-hour DeepLearning.AI course, Stanford University",
    "Excel, SQL and LaTeX — Learner's Space, IITB",
    "BCG Virtual Program",
    "Bloomberg Essentials",
    "6-hour JP Morgan Chase & Co Investment Banking, Forage",
  ],

  education: [
    {
      school: "Indian Institute of Technology, Bombay",
      degree: "B.Tech · Metallurgical Engineering and Materials Science",
      period: "2022 — 2026",
      detail: "CPI 8.29/10 · Mumbai, India",
      extra: [
        "Minor Degree in Artificial Intelligence and Data Science — Minor CPI 9.0",
        "CFA Level 1 Candidate (Aug 2025), USA",
      ],
    },
  ],

  interests: [
    "Trekking mountains and trails",
    "Traveling",
    "Cooking",
    "Learning languages (German, Japanese)",
    "Geopolitics",
    "Hollywood",
  ],

  skills: {
    Languages: ["C", "C++", "Python", "Java", "SQL", "JavaScript/TypeScript", "HTML", "CSS", "R", "LaTeX"],
    Backend: ["Spring Boot", "Node.js", "REST", "GraphQL", "WebSockets", "Pub/Sub", "Temporal.io"],
    "Cloud & Infra": ["GCP", "AWS (S3, Athena, Glue)", "Kubernetes", "Docker", "Terraform", "Linux", "CI/CD", "Kafka"],
    Databases: ["PostgreSQL", "MySQL", "MongoDB", "Neo4j", "Redis", "SQLite"],
    "AI / ML": ["PyTorch", "TensorFlow", "Keras", "scikit-learn", "XGBoost", "LightGBM", "RAG", "Knowledge graphs", "LangChain", "HuggingFace"],
    "Data & CV": ["NumPy", "Pandas", "SciPy", "Matplotlib", "Seaborn", "Polars", "OpenCV", "scikit-image", "Pillow"],
    NLP: ["spaCy", "NLTK", "TextBlob", "gensim", "pytesseract"],
    Observability: ["Datadog", "Sentry", "LangSmith", "Postman", "DBeaver"],
    Software: ["VSCode", "Xcode", "Docker", "Colab", "NotebookLM", "Power BI", "TradingView", "MS Office"],
    Coursework: [
      "Mathematical Optimization",
      "Advanced Methods in Image Processing",
      "Data Science",
      "Machine Learning",
      "Programming in C",
      "R&D Project in AI/ML",
      "Calculus",
      "Differential Equations",
      "Linear Algebra",
      "Entrepreneurship",
      "Digital Image Processing",
      "Stop-Motion Animation",
      "Molecular Simulations",
      "Numerical Methods",
      "Philosophy",
      "Arts",
      "Psychology",
    ],
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
