
interface KnowledgeEntry {
    keywords: string[];
    response: string;
    category: 'general' | 'ordering' | 'delivery' | 'product' | 'installation' | 'returns' | 'business' | 'safety';
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
    // --- COMPANY INFO ---
    {
        keywords: ['brightswitch', 'what is', 'products', 'sell', 'who are you'],
        category: 'general',
        response: "BrightSwitch is an electrical solutions provider specializing in MCBs, MCCBs, ELCBs, wires, switches, and complete electrical protection systems for homes and businesses."
    },
    {
        keywords: ['genuine', 'certified', 'original', 'certification', 'authentic'],
        category: 'general',
        response: "Yes, all products are 100% genuine with proper certifications including IEC standards, PSQCA approval, and come with manufacturer warranties."
    },

    // --- ORDERING & PAYMENT ---
    {
        keywords: ['place order', 'how to order', 'buy'],
        category: 'ordering',
        response: "You can order through our website, WhatsApp, or by calling our hotline. We accept Cash on Delivery, bank transfer, EasyPaisa, and JazzCash."
    },
    {
        keywords: ['cod', 'cash on delivery', 'pay on delivery'],
        category: 'ordering',
        response: "Yes, COD is available for orders up to ₹20,000 in major cities with a ₹150 processing fee."
    },
    {
        keywords: ['payment method', 'how to pay', 'payment options', 'credit card', 'easypaisa', 'jazzcash'],
        category: 'ordering',
        response: "We accept Cash on Delivery, EasyPaisa, JazzCash, bank transfers, and credit/debit cards."
    },

    // --- DELIVERY & SHIPPING ---
    {
        keywords: ['delivery time', 'how long', 'when will i get'],
        category: 'delivery',
        response: "Standard delivery takes 2-3 business days in cities, 3-5 days in other areas. Express delivery available for urgent orders."
    },
    {
        keywords: ['deliver to', 'location', 'area', 'city', 'cities', 'shipping area'],
        category: 'delivery',
        response: "We deliver across Pakistan including Peshawar, Islamabad, Lahore, Karachi, and all major cities."
    },
    {
        keywords: ['shipping cost', 'shipping fee', 'delivery charge', 'free shipping'],
        category: 'delivery',
        response: "Free shipping on orders above ₹10,000. Below ₹10,000, shipping is ₹200-500 depending on location."
    },

    // --- PRODUCT INFORMATION ---
    {
        keywords: ['choose mcb', 'right mcb', 'mcb for home', 'ampere', 'rating'],
        category: 'product',
        response: "For homes: 16A-32A MCBs for lighting, 32A for sockets. We can help you choose based on your electrical load. Pro Tip: Consider future expansion when choosing capacity."
    },
    {
        keywords: ['difference mcb mccb', 'mcb vs mccb', 'types of breaker'],
        category: 'product',
        response: "MCB (Miniature Circuit Breaker) for homes/small spaces up to 125A. MCCB (Molded Case Circuit Breaker) for commercial/industrial use, higher capacity."
    },
    {
        keywords: ['load shedding', 'protect appliances', 'stabilizer', 'fluctuation'],
        category: 'product',
        response: "Use voltage stabilizers and surge protectors to protect appliances during power fluctuations. We recommend specific products for expensive appliances."
    },
    {
        keywords: ['solar', 'dc mcb', 'solar system'],
        category: 'product',
        response: "Yes, we have DC-rated MCBs and special products designed for solar installations."
    },

    // --- INSTALLATION & SUPPORT ---
    {
        keywords: ['installation', 'install', 'electrician'],
        category: 'installation',
        response: "We can recommend certified electricians in your area. Installation guidance is provided with every product. Always ask: 'For home or business use?' so we can guide you better."
    },
    {
        keywords: ['damaged', 'broken', 'defect'],
        category: 'installation',
        response: "Contact us within 24 hours with photos. We'll arrange replacement or refund immediately."
    },
    {
        keywords: ['guide', 'video', 'tutorial', 'how to install'],
        category: 'installation',
        response: "Yes, we provide installation guides in Urdu/English and video tutorials on our YouTube channel."
    },

    // --- RETURNS & WARRANTY ---
    {
        keywords: ['return', 'return policy', 'exchange'],
        category: 'returns',
        response: "Unused products in original packaging can be returned within 7 days. Defective items replaced under warranty."
    },
    {
        keywords: ['warranty', 'guarantee', 'warranty period'],
        category: 'returns',
        response: "MCBs/MCCBs: 1-2 years warranty depending on brand. All products come with manufacturer warranty. Remind: Keep warranty cards safe."
    },

    // --- BUSINESS QUERIES ---
    {
        keywords: ['bulk', 'contractor', 'wholesale', 'b2b', 'discount'],
        category: 'business',
        response: "Yes! Special B2B pricing for contractors, electricians, and bulk orders. Contact us for volume discounts and dealer packages."
    },
    {
        keywords: ['dealer', 'distributor', 'become dealer'],
        category: 'business',
        response: "Contact our business development team for dealer applications, margins, and territory information."
    },

    // --- LOCAL/BONUS ---
    {
        keywords: ['see product', 'visit', 'showroom', 'photo', 'video request'],
        category: 'general',
        response: "Yes, you can visit our showroom or request product photos/videos via WhatsApp before ordering."
    },

    // --- CATCH-ALL / GREETINGS ---
    {
        keywords: ['hello', 'hi', 'hey', 'start', 'help'],
        category: 'general',
        response: "Hello! I'm your local BrightSwitch expert. I can help with installation guides, safety tips, and product specs. What do you need assistance with?"
    }
];

export const askLocalAssistant = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // Find the best match based on keyword overlap
    // We prioritize matches with more keywords to be more specific
    const sortedEntries = [...KNOWLEDGE_BASE].sort((a, b) => {
        const aMatchCount = a.keywords.filter(k => lowerQuery.includes(k)).length;
        const bMatchCount = b.keywords.filter(k => lowerQuery.includes(k)).length;
        return bMatchCount - aMatchCount;
    });

    const bestMatch = sortedEntries.find(entry =>
        entry.keywords.some(keyword => lowerQuery.includes(keyword))
    );

    if (bestMatch && bestMatch.keywords.some(k => lowerQuery.includes(k))) {
        return `[Local Mode] ${bestMatch.response}`;
    }

    // Fallback for no match
    return "[Local Mode] I'm currently operating in offline mode. I can answer questions about Ordering, Delivery, Products, Installation, and Warranty. For specific technical inquiries, please check our Catalog.";
};
