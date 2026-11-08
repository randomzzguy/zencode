// Client testimonials, quoted as supplied by each client.
// `quote` is the full text (one string per paragraph) for case study pages.
// `excerpt` is a verbatim cut of the quote for the home page and work rail.
// `logo` matches a display name from assets/ClientLogos; `project` links a case study.
export const testimonials = [
  {
    id: 'pcms',
    name: 'Eng. Sherif Abdallaa',
    role: 'Owner, Pilot Consultations & Marine Services (PCMS)',
    logo: 'Pilot Consultations Marine Services',
    project: 'pcms',
    excerpt: 'What started as a company website grew into PCMS, a system that has streamlined our daily operations. … I kept asking for new features, often unsure whether they were even possible, and they consistently delivered.',
    short: 'I kept asking for new features, often unsure whether they were even possible, and they consistently delivered.',
    quote: [
      'What started as a company website grew into PCMS, a system that has streamlined our daily operations. From managing invoices and certificates to QR code verification, calendar reminders and AI email assistance, everything was built around how we work.',
      'I kept asking for new features, often unsure whether they were even possible, and they consistently delivered. They listened to our feedback and made the system more useful while keeping it simple to use. It has made a real difference to how we run our business.'
    ]
  },
  {
    id: 'phyziolab',
    name: 'Zahira',
    role: 'Physiotherapist & co-owner, Phyziolab',
    logo: 'Phyziolab',
    project: 'phyziolab',
    excerpt: 'I love how simple, clean, and organised everything is. It doesn’t try to do too much, yet it delivers exactly what we need. … The team handled everything from A to Z…',
    short: 'It doesn’t try to do too much, yet it delivers exactly what we need. A perfect fit for PhyzioLab!',
    quote: [
      'Really appreciate the work put into this website. I love how simple, clean, and organised everything is. It doesn’t try to do too much, yet it delivers exactly what we need. A perfect fit for PhyzioLab!',
      'The team handled everything from A to Z, from securing our phyziolab.my domain to building the website with the styling and theme I wanted. They also set up our custom business email, hello@phyziolab.my, and assisted with registering our website on SSM Biz to establish it as our official business website. They even helped us with our official social media accounts and addressed the issues we’d been facing with our Instagram account repeatedly being taken down. Their support made the whole process so much easier!'
    ]
  },
  {
    id: 'eissya',
    name: 'Nur Siti Eissya',
    role: 'Home physiotherapist, Eissya Physio',
    logo: 'Eissya Physio',
    project: 'eissya',
    excerpt: 'Having this website has made it so much easier for potential clients to find out about my services and contact me. … It’s made managing my practice feel simpler, while giving my clients a lovely first impression.',
    quote: [
      'Having this website has made it so much easier for potential clients to find out about my services and contact me. The site is so pretty and beautifully designed, and I love having a space that reflects the care I put into my work.',
      'The admin portal has also been really helpful for keeping everything organised. I can add and manage patients, check my schedule and appointment timings, and see each patient’s package progress in one place. Being able to write notes directly in the portal helps me keep track of their condition and progress over time, so I can prepare for their next session.',
      'It’s made managing my practice feel simpler, while giving my clients a lovely first impression.'
    ]
  },
  {
    id: 'dinkframe',
    name: 'Farreez Isqandar',
    role: 'Pro pickleball player · DUPR 4.83 singles, 4.56 doubles · DINKFRAME customer',
    logo: 'DinkFrame',
    project: 'dinkframe',
    excerpt: '…I just upload my photos and tournament details, pick a style and colours, and within a few hours, I get exactly what I asked for.',
    short: '…within a few hours, I get exactly what I asked for. It means I always have something ready to post on social media, even during my busiest weeks.',
    quote: [
      'Between training and competitions, finding time to create content isn’t easy. DINKFRAME makes it so convenient—I just upload my photos and tournament details, pick a style and colours, and within a few hours, I get exactly what I asked for. It means I always have something ready to post on social media, even during my busiest weeks.'
    ]
  }
];

export const testimonialFor = slug => testimonials.find(t => t.project === slug);
