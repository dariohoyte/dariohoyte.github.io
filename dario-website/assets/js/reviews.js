/* Homepage testimonials — edit this file to manage the displayed content.
   Original quotations and attributions are preserved from the previous homepage.
   Headings are editorial summaries. Five gold stars are decorative only;
   rating is null until a reviewer explicitly provides a numerical rating. */
window.DARIO_REVIEWS = [
  {
    "id": 1,
    "heading": "Outstanding Customer Service",
    "quote": "Distinction - excellent customer service, outstanding speed of response and magnificent knowledge. Proactive and attentive to detail.",
    "attribution": "Roberto M. IT Manager, Western Union Reporting Manager Costa Rica",
    "rating": null
  },
  {
    "id": 2,
    "heading": "A Great Technical Asset",
    "quote": "Extremely knowledgeable, proactive thinker. Great technical asset.",
    "attribution": "Mark C. IT Manager Professional peer Barbados",
    "rating": null
  },
  {
    "id": 3,
    "heading": "Creative Problem Solver",
    "quote": "Is always quick with solutions, often thinking outside the box. Commendable critical thinking skills and making ideas into a reality.",
    "attribution": "Dorian M. MSc. Business Analytics Systems Developer (Data Engineer) Previous work colleague - direct reportee Barbados",
    "rating": null
  },
  {
    "id": 4,
    "heading": "Reliable & Dependable",
    "quote": "Dario is very competent and reliable. Dependable and has a willingness to troubleshoot and resolve any issue to great satisfaction.",
    "attribution": "Shelly-Ann G. BSc. Bussiness and Technology Communications, Buckinghamshire New University Professional peer USA",
    "rating": null
  },
  {
    "id": 5,
    "heading": "Highly Recommended",
    "quote": "I have called on Dario many times for IT related matters. He's assisted with selecting the best hardware and software solutions for my needs; setting up computers, phones, tablets, creating networks, and provided data analysis solutions etc. I HIGHLY recommend!",
    "attribution": "Saran H. Chartered Accountant FCCA, CPA, CGA Outsourcing jobs Barbados/Canada",
    "rating": null
  },
  {
    "id": 6,
    "heading": "Root-Cause Thinker",
    "quote": "Dario is innovative in his problem solving skills and determines root causes to avoid future problems.",
    "attribution": "Jamal B. BSc. University of the West Indies Professional Engineer (PE) Professional peer USA",
    "rating": null
  },
  {
    "id": 7,
    "heading": "Committed to Excellence",
    "quote": "Highly competent and knowledgeable in Information Technology. One who demonstrates excellent problem-solving skills. Diligent and sticks to tasks until completed.",
    "attribution": "Stacey A. Chartered Accountant/Tax Professional Previous work colleague Jamaica",
    "rating": null
  },
  {
    "id": 8,
    "heading": "Resourceful & Knowledgeable",
    "quote": "Extremely knowledgeable about tech, and finds solutions to save time and resources. Good at problem solving.",
    "attribution": "Shanice B. BComm. University of Guelph, Canada Previous work colleague Canada",
    "rating": null
  },
  {
    "id": 9,
    "heading": "Attention to Detail",
    "quote": "Diligent and high quality work. Competent problem solving skills with great attention to detail.",
    "attribution": "Khadija B. BSc. University of the West Indies, Barbados Previous work colleague Barbados",
    "rating": null
  },
  {
    "id": 10,
    "heading": "Above and Beyond",
    "quote": "Innovative thinker with exceptional programming skills who goes above and beyond to increase efficiency.",
    "attribution": "Lia B. BSc. University of the West Indies, Barbados Previous work colleague Barbados",
    "rating": null
  }
];

(() => {
  'use strict';
  const container = document.querySelector('#reviews .carousel-inner');
  if (!container) return;
  const entries = [...window.DARIO_REVIEWS];
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  container.replaceChildren();
  for (const [index, entry] of entries.entries()) {
    const slide = document.createElement('div');
    slide.className = 'carousel-item' + (index === 0 ? ' active' : '');
    const block = document.createElement('blockquote');
    block.className = 'review';
    const stars = document.createElement('div');
    stars.className = 'stars';
    stars.textContent = '★★★★★';
    if (typeof entry.rating === 'number') {
      stars.setAttribute('aria-label', `${entry.rating} out of 5 stars`);
    } else {
      stars.setAttribute('aria-hidden', 'true');
      stars.title = 'Decorative stars';
    }
    const heading = document.createElement('h3');
    heading.className = 'review-heading';
    heading.textContent = entry.heading;
    const quote = document.createElement('p');
    quote.className = 'review-quote';
    quote.textContent = `“${entry.quote}”`;
    const attribution = document.createElement('footer');
    attribution.className = 'review-attribution';
    attribution.textContent = entry.attribution;
    block.append(stars, heading, quote, attribution);
    slide.append(block);
    container.append(slide);
  }
})();
