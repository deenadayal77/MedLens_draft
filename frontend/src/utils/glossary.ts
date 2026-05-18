export const MEDICAL_GLOSSARY: Record<string, string> = {
  'hydronephrosis': 'Swelling of the kidney caused by urine backup',
  'hydroureter': 'Abnormal widening of the ureter (tube from kidney to bladder)',
  'pelviectasis': 'Mild widening of the kidney\'s urine collection area',
  'edema': 'Swelling caused by excess fluid trapped in body tissues',
  'malignant': 'Cancerous — can invade nearby tissue and spread',
  'benign': 'Not cancerous — does not spread to other body parts',
  'metastasis': 'Spread of cancer from its original site to other parts',
  'lesion': 'An area of abnormal tissue caused by injury or disease',
  'nodule': 'A small, solid lump that can be felt or seen on imaging',
  'cyst': 'A fluid-filled sac, usually not cancerous',
  'tumor': 'An abnormal growth — can be benign or malignant',
  'fracture': 'A break or crack in a bone',
  'stenosis': 'Abnormal narrowing of a passage in the body',
  'thrombosis': 'Formation of a blood clot inside a blood vessel',
  'aneurysm': 'An abnormal bulge in the wall of a blood vessel',
  'effusion': 'Abnormal fluid accumulation in a body cavity',
  'pneumothorax': 'Collapsed lung — air between lung and chest wall',
  'atelectasis': 'Partial or complete collapse of a lung',
  'consolidation': 'Lung area filled with fluid/infection instead of air',
  'cardiomegaly': 'Enlarged heart',
  'hepatomegaly': 'Enlarged liver',
  'splenomegaly': 'Enlarged spleen',
  'lymphadenopathy': 'Swollen or enlarged lymph nodes',
  'hernia': 'Organ pushing through a weak spot in muscle or tissue',
  'pancreatitis': 'Inflammation of the pancreas',
  'cirrhosis': 'Severe scarring of the liver',
  'fibrosis': 'Thickening and scarring of tissue',
  'calcification': 'Buildup of calcium deposits in body tissue',
  'scoliosis': 'Sideways curvature of the spine',
  'osteoporosis': 'Condition where bones become weak and brittle',
  'arthritis': 'Inflammation of joints causing pain and stiffness',
  'biopsy': 'Test where a tissue sample is removed for examination',
  'bilateral': 'Affecting both sides of the body',
  'anterior': 'Located at the front of the body',
  'posterior': 'Located at the back of the body',
  'enhancement': 'How tissue absorbs contrast dye — changes may indicate abnormality',
  'anastomosis': 'Surgical connection between two structures',
  'obstruction': 'A blockage preventing normal flow',
  'inflammation': 'Body\'s response to injury — redness, swelling, pain',
  'chronic': 'Long-lasting or recurring condition',
  'acute': 'Sudden onset, often severe but short-lasting',
  'impression': 'Radiologist\'s overall conclusion about findings',
  'labrum': 'A ring of cartilage around the edge of a joint socket',
  'labral': 'Related to the labrum (cartilage rim around a joint)',
  'chondral': 'Related to cartilage — the smooth tissue covering bone ends',
  'cartilage': 'Smooth, flexible tissue that covers the ends of bones at joints',
  'delamination': 'Separation or peeling of cartilage layers from bone',
  'femoral': 'Related to the femur (thigh bone)',
  'acetabular': 'Related to the acetabulum (hip socket)',
  'ligament': 'A tough band of tissue connecting bones at a joint',
  'tendon': 'A tough cord of tissue connecting muscle to bone',
  'meniscus': 'C-shaped cartilage cushion in the knee joint',
  'rotator cuff': 'Group of muscles and tendons stabilizing the shoulder joint',
  'disc herniation': 'When a spinal disc bulges or ruptures pressing on nerves',
  'degeneration': 'Gradual breakdown or deterioration of tissue',
  'osteophyte': 'A bony growth (bone spur) at the edge of a joint',
  'subluxation': 'Partial dislocation of a joint',
  'avascular necrosis': 'Death of bone tissue due to lack of blood supply',
  'gadolinium': 'A contrast dye used in MRI scans to improve image detail',
  'saline': 'A sterile saltwater solution used in medical procedures',
  'arthrogram': 'An imaging test where dye is injected into a joint',
  'collagen': 'Main structural protein in skin, bone, cartilage, and tendons',
  'alpha angle': 'A measurement of the shape of the femoral head and neck',
  'ropivacaine': 'A local anesthetic used to numb specific body areas',
  'synovial': 'Related to the membrane lining joints, producing lubricating fluid',
  'dilation': 'Widening or enlargement beyond normal size',
  'whipple procedure': 'Major surgery to remove the head of the pancreas and surrounding structures',
};

export interface GlossaryTerm {
  term: string;
  definition: string;
}

/**
 * Scans a given text and extracts matching terms from the MEDICAL_GLOSSARY.
 * Returns unique matching terms with their definitions.
 */
export function extractGlossaryTerms(text: string): GlossaryTerm[] {
  if (!text) return [];
  
  const foundTerms: Map<string, string> = new Map();
  const lowerText = text.toLowerCase();

  for (const [term, definition] of Object.entries(MEDICAL_GLOSSARY)) {
    // Only match whole words
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(lowerText)) {
      // Find the actual cased word in the text if possible, otherwise use the glossary key
      const match = text.match(regex);
      const displayTerm = match ? match[0] : term;
      
      // Capitalize first letter for display
      const capitalizedTerm = displayTerm.charAt(0).toUpperCase() + displayTerm.slice(1).toLowerCase();
      
      // Use the lowercase term as key to prevent duplicates
      if (!foundTerms.has(term.toLowerCase())) {
        foundTerms.set(term.toLowerCase(), { term: capitalizedTerm, definition } as any);
      }
    }
  }

  return Array.from(foundTerms.values()) as any as GlossaryTerm[];
}

/**
 * Replaces matching medical terms in text with markdown glossary links.
 * Uses a segment-based approach to skip already-linked terms.
 * Example: "hydronephrosis" → "[hydronephrosis](glossary:Swelling...)"
 */
export function applyGlossaryMarkdown(text: string): string {
  if (!text) return '';

  // Sort longest first so multi-word terms match before their sub-words
  const sortedTerms = Object.keys(MEDICAL_GLOSSARY).sort((a, b) => b.length - a.length);

  // Split by existing markdown links (capturing group keeps them in the array)
  // Odd-indexed parts are already-linked text → skip them
  const linkPattern = /(\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(linkPattern);

  const processedParts = parts.map((part, index) => {
    // Skip already-linked segments (odd indices from capturing split)
    if (index % 2 === 1) return part;

    let processed = part;
    for (const term of sortedTerms) {
      const definition = MEDICAL_GLOSSARY[term];
      // Correct special char escaping for use in RegExp constructor
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      processed = processed.replace(regex, (match) =>
        `[${match}](glossary:${encodeURIComponent(definition)})`
      );
    }
    return processed;
  });

  return processedParts.join('');
}
