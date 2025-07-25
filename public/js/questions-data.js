/**
 * VALID Assessment Questions Data
 * This module contains the core question bank and metadata for the VALID assessment.
 * 
 * VALID Framework Dimensions:
 * - Verity: Truth-seeking and factual decision making
 * - Association: Relationship and collaboration-based choices
 * - Lived Experience: Personal experience-based judgment
 * - Institutional Knowledge: Formal learning and established practices
 * - Desire: Aspirational and future-focused thinking
 */

// Create and freeze the assessment data to prevent modifications
const validAssessment = Object.freeze({
    metadata: {
        version: '2.0.0',
        scale: {
            min: 1,
            max: 7,
            step: 1,
            labels: {
                1: 'Not Very Characteristic',
                2: 'Somewhat Uncharacteristic',
                3: 'Slightly Uncharacteristic',
                4: 'Neutral',
                5: 'Slightly Characteristic',
                6: 'Somewhat Characteristic',
                7: 'Very Characteristic'
            }
        },
        dimensions: ['V', 'A', 'L', 'I', 'D'],
        scoring: {
            rangeMin: 10,
            rangeMax: 70,
            interpretationBands: {
                'Very Low': { min: 10, max: 25 },
                'Low': { min: 26, max: 40 },
                'Moderate': { min: 41, max: 55 },
                'High': { min: 56, max: 65 },
                'Very High': { min: 66, max: 70 }
            }
        }
    },
    questions: [
        // Decision Triggers & Approach
        {
            id: "DT-01",
            text: "When facing an important choice, I start by gathering facts and data.",
            category: "decision_triggers",
            dimension: "V",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "DT-02",
            text: "When I need to decide something significant, I first think about who else has dealt with this.",
            category: "decision_triggers",
            dimension: "A",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "DT-03",
            text: "When a big decision comes up, I reflect on similar situations I've experienced.",
            category: "decision_triggers",
            dimension: "L",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "DT-04",
            text: "When I have an important choice to make, I look for established guidelines or best practices.",
            category: "decision_triggers",
            dimension: "I",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "DT-05",
            text: "When facing a major decision, I start by clarifying what outcome would feel most meaningful.",
            category: "decision_triggers",
            dimension: "D",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "DT-06",
            text: "I often make decisions without waiting for complete data.",
            category: "decision_triggers",
            dimension: "V",
            reverse: true,
            scale: [1, 7]
        },
        {
            id: "DT-07",
            text: "I prefer to decide things independently rather than seek input from others.",
            category: "decision_triggers",
            dimension: "A",
            reverse: true,
            scale: [1, 7]
        },

        // Information Sources & Weighting
        {
            id: "IG-01",
            text: "I trust decisions more when they're backed by solid research and evidence.",
            dimension: "verity",
            category: "information",
            reverse: false
        },
        {
            id: "IG-02",
            text: "I value input from people whose judgment I respect over other sources.",
            dimension: "association",
            category: "information",
            reverse: false
        },
        {
            id: "IG-03",
            text: "My own past experiences carry more weight than outside opinions.",
            dimension: "lived",
            category: "information",
            reverse: false
        },
        {
            id: "IG-04",
            text: "I feel confident when recognized experts support my thinking.",
            dimension: "institutional",
            category: "information",
            reverse: false
        },
        {
            id: "IG-05",
            text: "I prioritize options that align with my personal values and vision.",
            dimension: "desire",
            category: "information",
            reverse: false
        },
        {
            id: "IG-06",
            text: "Too much analysis can paralyze good decision-making.",
            dimension: "verity",
            category: "information",
            reverse: true
        },
        {
            id: "IG-07",
            text: "Other people's opinions rarely change my mind once it's made up.",
            dimension: "association",
            category: "information",
            reverse: true
        },

        // Confidence & Certainty
        {
            id: "CB-01",
            text: "I'm most confident when the numbers clearly point in one direction.",
            dimension: "verity",
            category: "confidence",
            reverse: false
        },
        {
            id: "CB-02",
            text: "I feel sure about a decision when people I trust agree with me.",
            dimension: "association",
            category: "confidence",
            reverse: false
        },
        {
            id: "CB-03",
            text: "I'm confident in choices that mirror what's worked for me before.",
            dimension: "lived",
            category: "confidence",
            reverse: false
        },
        {
            id: "CB-04",
            text: "I feel confident when I can point to established research supporting my approach.",
            dimension: "institutional",
            category: "confidence",
            reverse: false
        },
        {
            id: "CB-05",
            text: "I'm most confident when a decision feels right in my gut.",
            dimension: "desire",
            category: "confidence",
            reverse: false
        },
        {
            id: "CB-06",
            text: "I'm open to approaches I've never tried before, even if they seem risky.",
            dimension: "lived",
            category: "confidence",
            reverse: true
        },
        {
            id: "CB-07",
            text: "I often ignore established procedures when they don't make practical sense.",
            dimension: "institutional",
            category: "confidence",
            reverse: true
        },

        // Pressure & Urgency
        {
            id: "UP-01",
            text: "When time is tight, I quickly scan the available data to guide my choice.",
            dimension: "verity",
            category: "urgency",
            reverse: false
        },
        {
            id: "UP-02",
            text: "Under pressure, I reach out to trusted colleagues for quick input.",
            dimension: "association",
            category: "urgency",
            reverse: false
        },
        {
            id: "UP-03",
            text: "When rushed, I fall back on what's worked in similar urgent situations.",
            dimension: "lived",
            category: "urgency",
            reverse: false
        },
        {
            id: "UP-04",
            text: "In high-pressure moments, I follow established protocols or procedures.",
            dimension: "institutional",
            category: "urgency",
            reverse: false
        },
        {
            id: "UP-05",
            text: "When the stakes are high, I trust my instincts to guide me.",
            dimension: "desire",
            category: "urgency",
            reverse: false
        },
        {
            id: "UP-06",
            text: "Past experience can blind you to better new possibilities.",
            dimension: "lived",
            category: "urgency",
            reverse: true
        },
        {
            id: "UP-07",
            text: "Following standard procedures isn't always the best approach in a crisis.",
            dimension: "institutional",
            category: "urgency",
            reverse: true
        },

        // Conflict & Disagreement
        {
            id: "CR-01",
            text: "When people disagree, I look for objective evidence to settle the dispute.",
            dimension: "verity",
            category: "conflict",
            reverse: false
        },
        {
            id: "CR-02",
            text: "When there's conflict, I work to build consensus among the group.",
            dimension: "association",
            category: "conflict",
            reverse: false
        },
        {
            id: "CR-03",
            text: "When others disagree with me, I stick with what my experience tells me.",
            dimension: "lived",
            category: "conflict",
            reverse: false
        },
        {
            id: "CR-04",
            text: "When there's disagreement, I consult whoever has the most relevant expertise.",
            dimension: "institutional",
            category: "conflict",
            reverse: false
        },
        {
            id: "CR-05",
            text: "When people can't agree, I advocate for the option that feels most authentic.",
            dimension: "desire",
            category: "conflict",
            reverse: false
        },
        {
            id: "CR-06",
            text: "I don't trust decisions based purely on feelings or emotions.",
            dimension: "desire",
            category: "conflict",
            reverse: true
        },

        // Evaluation & Learning
        {
            id: "PD-01",
            text: "I judge my decisions by whether the measurable outcomes match my predictions.",
            dimension: "verity",
            category: "evaluation",
            reverse: false
        },
        {
            id: "PD-02",
            text: "I evaluate decisions based on feedback from people whose opinions matter to me.",
            dimension: "association",
            category: "evaluation",
            reverse: false
        },
        {
            id: "PD-03",
            text: "I assess my choices by comparing results to similar decisions I've made.",
            dimension: "lived",
            category: "evaluation",
            reverse: false
        },
        {
            id: "PD-04",
            text: "I measure success by how well I followed established best practices.",
            dimension: "institutional",
            category: "evaluation",
            reverse: false
        },
        {
            id: "PD-05",
            text: "I judge decisions by whether they achieved what felt most important to me.",
            dimension: "desire",
            category: "evaluation",
            reverse: false
        },
        {
            id: "PD-06",
            text: "Logic should override intuition when making important decisions.",
            dimension: "desire",
            category: "evaluation",
            reverse: true
        },

        // General Validation Preferences
        {
            id: "SA-01",
            text: "I rarely make important decisions without first examining the data thoroughly.",
            dimension: "verity",
            category: "general",
            reverse: false
        },
        {
            id: "SA-02",
            text: "Hard facts and evidence convince me more than personal stories or opinions.",
            dimension: "verity",
            category: "general",
            reverse: false
        },
        {
            id: "SA-03",
            text: "I actively seek input from my network before making significant choices.",
            dimension: "association",
            category: "general",
            reverse: false
        },
        {
            id: "SA-04",
            text: "The opinions of people I respect heavily influence my decisions.",
            dimension: "association",
            category: "general",
            reverse: false
        },
        {
            id: "SA-05",
            text: "I trust my own direct experience over what others tell me.",
            dimension: "lived",
            category: "general",
            reverse: false
        },
        {
            id: "SA-06",
            text: "I learn best by trying things myself rather than following instructions.",
            dimension: "lived",
            category: "general",
            reverse: false
        },
        {
            id: "SA-07",
            text: "I prefer following established procedures over creating my own approach.",
            dimension: "institutional",
            category: "general",
            reverse: false
        },
        {
            id: "SA-08",
            text: "Expert opinions carry significant weight in my decision-making process.",
            dimension: "institutional",
            category: "general",
            reverse: false
        },
        {
            id: "SA-09",
            text: "My gut feelings are usually reliable guides for important choices.",
            dimension: "desire",
            category: "general",
            reverse: false
        },
        {
            id: "SA-10",
            text: "I won't pursue options that conflict with my core values, even if they seem logical.",
            dimension: "desire",
            category: "general",
            reverse: false
        },

        // Social Desirability Scale
        {
            id: "SD-01",
            text: "I have never intensely disliked anyone.",
            dimension: "social_desirability",
            category: "quality",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "SD-02",
            text: "I sometimes feel resentful when I don't get my way.",
            dimension: "social_desirability",
            category: "quality",
            reverse: true,
            scale: [1, 7]
        },
        {
            id: "SD-03",
            text: "I am always courteous, even to people who are disagreeable.",
            dimension: "social_desirability",
            category: "quality",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "SD-04",
            text: "There have been times when I felt like rebelling against authority.",
            dimension: "social_desirability",
            category: "quality",
            reverse: true,
            scale: [1, 7]
        },
        {
            id: "SD-05",
            text: "I have never been irked when people expressed ideas very different from my own.",
            dimension: "social_desirability",
            category: "quality",
            reverse: false,
            scale: [1, 7]
        },

        // Attention Checks
        {
            id: "AC-01",
            text: "Please select '4 - Neutral' for this statement: I am paying attention to this survey.",
            dimension: "attention_check",
            category: "quality",
            correctAnswer: 4,
            scale: [1, 7]
        },
        {
            id: "AC-02",
            text: "For quality control purposes, please select 'Not very characteristic' (1) for this item.",
            dimension: "attention_check",
            category: "quality",
            correctAnswer: 1,
            scale: [1, 7]
        },

        // Metacognitive Awareness
        {
            id: "AW-01",
            text: "I often reflect on how I arrived at a decision.",
            category: "awareness",
            dimension: "Awareness",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "AW-02",
            text: "I can tell when my emotions are influencing my judgment.",
            category: "awareness",
            dimension: "Awareness",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "AW-03",
            text: "I recognize when external advice is affecting my thinking.",
            category: "awareness",
            dimension: "Awareness",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "AW-04",
            text: "I rarely stop to question my own reasoning process.",
            category: "awareness",
            dimension: "Awareness",
            reverse: true,
            scale: [1, 7]
        },
        {
            id: "AW-05",
            text: "I know when I'm making decisions out of habit.",
            category: "awareness",
            dimension: "Awareness",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "AW-06",
            text: "I adjust my decision style depending on the situation.",
            category: "awareness",
            dimension: "Awareness",
            reverse: false,
            scale: [1, 7]
        },
        {
            id: "AW-07",
            text: "I make most decisions without much self-reflection.",
            category: "awareness",
            dimension: "Awareness",
            reverse: true,
            scale: [1, 7]
        }
    ]
});

// Export the assessment data
export default validAssessment;

// Also export individual parts for convenience
export const { questions, metadata } = validAssessment;