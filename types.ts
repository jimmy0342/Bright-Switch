
export type UserRole = 'customer' | 'buyer' | 'admin' | 'warehouse' | 'electrician';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  photoURL?: string;
  companyName?: string;
  taxId?: string;
  creditLimit?: number;
  creditUsed?: number;
  paymentTerms?: 'Net 15' | 'Net 30' | 'Net 60';
  businessLicense?: string;
  addresses: string[];
  createdAt: number;
}

export interface Product {
  id: string;
  slug?: string;

  // CORE PRODUCT INFORMATION
  name: string; // productName
  sku: string; // productSku
  model: string; // productModel
  category: string; // productCategory
  subCategory?: string; // productSubcategory
  brand?: string; // productBrand
  type?: string; // productType
  tags?: string[]; // productTags
  description: string; // productDescription
  shortDescription: string;
  status: 'published' | 'draft' | 'archived'; // productStatus

  // PRICING (Nested structure)
  price: {
    base: number; // basePrice
    cost: number; // costPrice
    b2b: number; // b2bPrice
    taxRate: number; // taxRate
    unit: string; // priceUnit
  };

  // INVENTORY & STOCK (Nested structure)
  inventory: {
    stock: number; // stockQuantity
    initialStock?: number; // Added to track original added amount
    status: 'In Stock' | 'Our of Stock';
    manageStock: boolean;
    lowStockThreshold: number;
    backorderAllowed: boolean;
    location: string; // stockLocation
    minOrderQty?: number;
    maxOrderQty?: number;
  };

  // ELECTRICAL SPECIFICATIONS (Nested structure)
  specs: {
    currentRating: string;
    voltageRating: string;
    breakingCapacity: string;
    numberOfPoles: string; // poles
    tripCharacteristic: string; // tripCurve
    mountingType?: string;
    standardsCompliance?: string;
    frequency: string;
    operatingTemperature?: string;
    degreeOfProtection?: string; // enclosureRating
    material: string;
    color: string;
    dimensions?: string;
    weight?: string;
    wireSizeRange?: string;
    customSpecs?: Record<string, any>;
  };

  // IMAGES & MEDIA
  images: {
    main: string;
    gallery: string[];
  };
  media?: {
    videos?: string; // productVideos
    datasheet?: string; // datasheetFile
    installationGuide?: string;
    certificates?: string; // certificateFile
  };

  // SHIPPING & LOGISTICS
  shipping: {
    weightKg: number;
    dimensionsCm: string;
    class: string; // shippingClass
    isFragile: boolean;
    isHazardous: boolean;
    requiresSpecialHandling: boolean;
  };

  // B2B SPECIFIC
  b2b: {
    isB2BProduct: boolean;
    minQty: number;
    priceTiers: { qty: number; price: number }[];
    leadTime: string;
    moq: number;
    bulkDiscount: number;
    supplierCode?: string;
    supplierName?: string;
    countryOfOrigin?: string;
    batchNumber?: string;
    serializedInventory?: boolean;
    reorderPoint?: number;
  };

  // WARRANTY & SUPPORT
  warranty: {
    period: string;
    type: string;
    supportContact: string;
    returnPolicy: string;
  };

  // DISPLAY & SEO
  sortOrder: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };

  // LEGACY/METADATA Compatibility
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isHotDeal?: boolean;
  soldCount?: number;
  salesCount?: number;
  averageRating?: number;
  reviewCount?: number;
  views?: number;
  lastViewedAt?: number;
  reserved?: number;
  updatedAt: number;
  createdAt: number;
}

export interface HotDeal {
  id: string;
  dealTitle: string;
  dealSlug: string;
  dealType: 'percentage_discount' | 'fixed_discount' | 'bundle_offer' | 'buy_x_get_y' | 'clearance';
  dealPriority: 'high' | 'medium' | 'low';

  discountValue: number;
  discountType: 'percentage' | 'fixed_amount';
  minimumPurchaseAmount?: number;
  maximumDiscountAmount?: number;

  applicableTo: 'specific_products' | 'category_products' | 'all_products';
  applicableProducts: string[];
  applicableCategories: string[];
  excludedProducts: string[];

  startDateTime: string;
  endDateTime: string;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  timezone: string;

  usageLimitPerCustomer?: number;
  totalUsageLimit?: number;
  minimumQuantity?: number;
  maximumQuantity?: number;

  isActive: boolean;
  displayPosition: 'homepage_banner' | 'product_page' | 'cart_page' | 'all_pages';
  bannerImage?: string;
  badgeColor: string;
  badgeText: string;
  showCountdown: boolean;
  highlightColor?: string;

  shortDescription: string;
  termsConditions: string;
  promoCode?: string;
  callToAction: string;

  dealGoal?: string;
  budgetAllocated?: number;
  trackConversions: boolean;

  combinableWithOtherDeals: boolean;
  combinableWithCoupons: boolean;
  exclusiveDeal: boolean;

  createdAt: number;
  updatedAt: number;
}

export interface SystemSettings {
  corporateAddress: string;
  supportEmail: string;
  supportPhone: string;
  officeHours: string;
  industrialTax: number;
  codFee: number;
  mapLat: number;
  mapLng: number;
  easypaisaNumber?: string;
  updatedAt: number;
}

export interface Order {
  id: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  userCompanyName?: string;
  source: 'direct' | 'quote' | 'buy_now' | 'website';
  quoteId?: string;
  items: {
    productId: string;
    name: string;
    qty: number;
    price: number;
    image?: string;
  }[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  codFee?: number;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'pending_payment' | 'expired' | 'confirmed' | 'cod_pending';
  orderType: 'b2c' | 'b2b' | 'cod';
  paymentMethod: 'card' | 'bank' | 'easypaisa' | 'jazzcash' | 'cod' | 'invoice' | 'transfer';
  paymentStatus: 'Paid' | 'Pending' | 'Credit' | 'awaiting_bank_transfer';
  paymentDetails?: {
    codFee: number;
    totalWithFee: number;
    verified: boolean;
  };
  shippingAddress: string;
  trackingNumber?: string;
  createdAt: number;
  expiresAt?: number;
  isBuyNow?: boolean;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  tags: string[];
  readTime: string;
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  views: number;
  likes: number;
  publishedAt: number;
  updatedAt: number;
  createdAt: number;
}

export interface QuoteItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  specs: Record<string, string>;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  buyerId: string;
  buyerCompanyName: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'approved' | 'converted' | 'revised';
  adminNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ActivityLogItem {
  id: string;
  type: string;
  referenceId: string;
  message: string;
  read: boolean;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CODCollection {
  id: string;
  orderId: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  expectedAmount: number;
  collectedAmount: number;
  collectionStatus: 'scheduled' | 'out_for_collection' | 'collected' | 'failed';
  scheduledDate: string;
  scheduledTimeSlot: string;
  priority: 'high' | 'normal';
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  warehouseId: string;
  attemptCount: number;
  maxAttempts: number;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id: string;
  orderId?: string;
  userId?: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  transactionId?: string;
  gatewayResponse?: any;
  invoiceNumber: string;
  paidAt?: any; // Firestore Timestamp
  refundedAt?: any;
  refundAmount?: number;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Invoice {
  id: string;
  quoteId?: string;
  buyerId: string;
  companyName: string;
  invoiceNumber: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  dueDate: any;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  sentAt?: any;
  paidAt?: any;
  paymentTerms: number;
  createdAt: any;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  labelUrl?: string;
  status: 'pre_transit' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failure' | 'returned';
  estimatedDelivery?: any;
  shippedAt: any;
  weight?: number;
  cost?: number;
  createdAt: any;
}

export interface Carrier {
  id: string;
  name: string;
  code: string;
  accountNumber?: string;
  connected: boolean;
}

export interface FulfillmentTask {
  assignedTo?: string; // Driver/Carrier ID
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  updatedAt: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order?: number;
  createdAt?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  specialization: string;
  image: string;
  order?: number;
  createdAt?: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  displayOrder: number;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Electrician {
  id: string;
  electricianId: string;
  userId: string;
  fullName: string;
  businessName?: string;
  businessAddress?: string;
  phone: string;
  email: string;
  cnic?: string;
  avatar?: string;
  perDayCharge?: number;
  pecNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  yearsExperience: number;
  teamSize?: number;
  specializations: string[];
  verified: boolean;
  verifiedAt?: number;
  verifiedBy?: string;
  serviceAreas: string[];
  totalJobs: number;
  averageRating: number;
  status: 'active' | 'suspended';
  earnings: {
    totalEarned: number;
    pendingPayments: number;
    availableBalance: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ElectricianApplication {
  id: string;
  userId: string;
  personalInfo: {
    fullName: string;
    cnic: string;
    phone: string;
    email: string;
    password?: string;
  };
  credentials: {
    pecNumber: string;
    licenseNumber: string;
    licenseExpiry: string;
    specialization: string[];
  };
  documents: {
    cnicFront: string;
    cnicBack: string;
    licenseImage: string;
    pecCertificate: string;
  };
  businessInfo: {
    companyName: string;
    businessAddress: string;
    yearsExperience: number;
    teamSize: number;
    perDayCharge: number;
    serviceAreas: string[];
  };
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: number;
}

export interface ElectricianJob {
  id: string;
  electricianId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  title: string;
  description: string;
  type: string;
  priority: 'normal' | 'urgent';
  location: string;
  preferredDate: string;
  timeSlot: string;
  quoteAmount: number;
  materialsCost: number;
  laborCost: number;
  estimatedHours: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: number;
}

export interface ElectricianOrder {
  id: string;
  electricianId: string;
  items: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    tradePrice: number;
    retailPrice: number;
  }[];
  subtotal: number;
  total: number;
  status: 'processing' | 'shipped' | 'delivered';
  createdAt: number;
}

export interface ServiceRequest {
  id: string;
  requestId: string;
  customerId?: string | null;
  orderId?: string | null;
  assignmentType?: 'direct' | 'broadcast'; // Added this line

  // NEW FIELDS
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  title: string;
  serviceType: 'Installation' | 'Repair' | 'Maintenance' | 'Inspection' | 'Other';
  otherServiceType?: string;
  urgency: 'Normal (Within 1 week)' | 'Urgent (Within 2-3 days)' | 'Emergency (Within 24 hours)';
  description: string;

  products: {
    name?: string;
    quantity?: number;
    brand?: string;
    customerWillProvide?: boolean;
    productId?: string; // Legacy
    requiresInstallation?: boolean; // Legacy
  }[];

  location: {
    fullAddress: string;
    landmark?: string;
    instructions?: string;
    address?: string; // Legacy
  };

  preferredDate: string;
  preferredTimeSlot: string;
  flexibility: boolean;

  budgetMin: number;
  budgetMax: number;
  estimatedBudget?: number; // Legacy
  daysRequired?: number; // New time-based pricing

  questions?: string;

  status: 'pending' | 'matching' | 'offers_received' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  matchedElectricians: string[];
  selectedElectricianId?: string;
  targetedElectricianId?: string;
  rejectedElectricians: string[];
  createdAt: any;
  matchedAt?: any;
  confirmedAt?: any;
  completedAt?: any;
}

export interface ServiceOffer {
  id: string;
  offerId: string;
  requestId: string;
  electricianId: string;
  electricianName?: string;
  perDayCharge?: number;
  electricianAvatar?: string;
  quotedPrice: number;
  estimatedHours: number;
  startDate: string;
  startTime: string;
  message: string;
  electricianRating: number;
  completedJobs: number;
  verifiedBadge: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  viewedByCustomer: boolean;
  viewedAt?: any;
  expiresAt: any;
  createdAt: any;
}

export interface ServiceJob {
  id: string;
  jobId: string;
  requestId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  electricianId: string;
  electricianName?: string;
  serviceType: string;
  description: string;
  products: {
    productId: string;
    name: string;
    quantity: number;
    status: 'pending' | 'installed' | 'issue';
  }[];
  productTotal: number;
  serviceFee: number;
  totalAmount: number;
  payment: {
    customerPaid: number;
    platformFee: number;
    electricianEarns: number;
    status: 'held' | 'released' | 'disputed';
  };
  location?: {
    address: string;
    instructions?: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  actualStartTime?: any;
  actualEndTime?: any;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  commissionPaid?: boolean;
  commissionReceiptUrl?: string;
  statusHistory: { status: string; timestamp: any }[];
  messages: any[];
  completedAt?: any;
  completionNotes?: string;
  completionPhotos: string[];
  customerRating?: number;
  customerReview?: string;
  electricianRating?: number;
  electricianReview?: string;
  createdAt: any;
  updatedAt: any;
}
