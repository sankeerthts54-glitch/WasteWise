import { FieldConfig } from './fieldTypes';

export interface DomainConfig {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  fields: FieldConfig[];
  promptFocus: string;
}

export const DOMAINS: DomainConfig[] = [
  {
    slug: 'waste-segregation',
    name: 'Waste Segregation',
    description: 'Get a personalised plan to sort, reduce, and correctly dispose of your household or business waste.',
    icon: 'Trash2',
    category: 'Waste',
    promptFocus:
      'Focus on correct categorisation of waste types (wet/dry/hazardous/e-waste/biomedical), local municipal rules for Indian cities, composting feasibility, and practical steps to reduce landfill contribution.',
    fields: [
      {
        name: 'location',
        label: 'City / Town',
        type: 'text',
        required: true,
        placeholder: 'e.g. Bengaluru, Mumbai, Delhi',
        helpText: 'Enter the city where you generate this waste so we can tailor municipal rules.',
        maxLength: 80,
      },
      {
        name: 'settingType',
        label: 'Setting',
        type: 'radio',
        required: true,
        options: [
          { value: 'household', label: 'Household' },
          { value: 'apartment_complex', label: 'Apartment complex' },
          { value: 'small_business', label: 'Small business / shop' },
          { value: 'office', label: 'Office / co-working space' },
          { value: 'restaurant', label: 'Restaurant / food stall' },
        ],
      },
      {
        name: 'dailyWasteKg',
        label: 'Estimated daily waste generated (kg)',
        type: 'slider',
        required: true,
        min: 0.5,
        max: 50,
        step: 0.5,
        defaultValue: 2,
      },
      {
        name: 'wasteTypes',
        label: 'Types of waste you generate',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'food_scraps', label: 'Food scraps / kitchen waste' },
          { value: 'paper', label: 'Paper & cardboard' },
          { value: 'plastic', label: 'Plastic packaging' },
          { value: 'glass', label: 'Glass' },
          { value: 'metal', label: 'Metal / cans' },
          { value: 'textiles', label: 'Textiles / old clothes' },
          { value: 'garden', label: 'Garden / yard waste' },
          { value: 'sanitary', label: 'Sanitary waste' },
          { value: 'hazardous', label: 'Hazardous (batteries, paint, chemicals)' },
        ],
      },
      {
        name: 'currentPractice',
        label: 'Current disposal practice',
        type: 'select',
        required: true,
        options: [
          { value: 'mixed_bin', label: 'Everything goes in one bin' },
          { value: 'some_segregation', label: 'I do some segregation' },
          { value: 'full_segregation', label: 'I already segregate fully' },
          { value: 'no_formal', label: 'No formal collection in my area' },
        ],
      },
      {
        name: 'composting',
        label: 'Do you have outdoor space for composting?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes', label: 'Yes (garden / balcony)' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        name: 'challengesText',
        label: 'Any specific challenges or goals?',
        type: 'textarea',
        required: false,
        placeholder: 'e.g. building has no dry-waste bin, or I want zero landfill by end of year',
        maxLength: 400,
      },
    ],
  },
  {
    slug: 'ewaste-disposal',
    name: 'E-Waste Disposal',
    description: 'Find safe, responsible ways to dispose of your electronics, batteries, and electrical equipment.',
    icon: 'Cpu',
    category: 'Waste',
    promptFocus:
      'Focus on Indian e-waste regulations (E-Waste Management Rules 2022), authorised dismantlers and recyclers, data security before disposal, producer responsibility organisations (PROs), and how to claim refunds or exchange credits where available.',
    fields: [
      {
        name: 'location',
        label: 'City / Town',
        type: 'text',
        required: true,
        placeholder: 'e.g. Pune, Chennai, Hyderabad',
        maxLength: 80,
      },
      {
        name: 'deviceTypes',
        label: 'What devices do you need to dispose of?',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'smartphones', label: 'Smartphones / tablets' },
          { value: 'laptops', label: 'Laptops / computers' },
          { value: 'large_appliances', label: 'Large appliances (TV, fridge, AC)' },
          { value: 'small_appliances', label: 'Small appliances (mixer, iron, fan)' },
          { value: 'printers', label: 'Printers / peripherals' },
          { value: 'batteries', label: 'Batteries / power banks' },
          { value: 'cables', label: 'Cables / chargers / adapters' },
          { value: 'medical_devices', label: 'Medical devices (BP monitor, nebuliser)' },
        ],
      },
      {
        name: 'quantity',
        label: 'Approximate quantity of items',
        type: 'radio',
        required: true,
        options: [
          { value: '1_to_5', label: '1–5 items' },
          { value: '6_to_20', label: '6–20 items' },
          { value: 'more_than_20', label: 'More than 20 items' },
        ],
      },
      {
        name: 'dataDevices',
        label: 'Do any devices contain sensitive personal or business data?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Unsure' },
        ],
      },
      {
        name: 'workingCondition',
        label: 'Condition of the devices',
        type: 'select',
        required: true,
        options: [
          { value: 'fully_working', label: 'Fully working' },
          { value: 'partially_working', label: 'Partially working / repairable' },
          { value: 'broken', label: 'Broken / non-functional' },
          { value: 'mixed', label: 'Mixed conditions' },
        ],
      },
      {
        name: 'preferExchange',
        label: 'Are you interested in exchange/buyback offers?',
        type: 'checkbox',
        required: false,
        defaultValue: false,
      },
      {
        name: 'additionalContext',
        label: 'Anything else we should know?',
        type: 'textarea',
        required: false,
        placeholder: 'e.g. bulk corporate disposal, need certificate of destruction, urgent timeline',
        maxLength: 400,
      },
    ],
  },
  {
    slug: 'recycling-upcycling',
    name: 'Recycling & Upcycling',
    description: 'Discover how to turn waste materials into value — from selling recyclables to creative upcycling projects.',
    icon: 'RefreshCw',
    category: 'Waste',
    promptFocus:
      "Focus on material-specific recycling streams in India, kabadiwala networks, scrap dealers, NGO collection drives, and practical DIY upcycling ideas that match the user's materials and skill level. Include potential income or cost-saving estimates.",
    fields: [
      {
        name: 'location',
        label: 'City / Town',
        type: 'text',
        required: true,
        placeholder: 'e.g. Kolkata, Ahmedabad, Jaipur',
        maxLength: 80,
      },
      {
        name: 'materials',
        label: 'Materials you want to recycle or upcycle',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'paper_cardboard', label: 'Paper & cardboard' },
          { value: 'plastic_bottles', label: 'Plastic bottles / containers' },
          { value: 'glass_bottles', label: 'Glass bottles / jars' },
          { value: 'metal_scrap', label: 'Metal scrap / tins / cans' },
          { value: 'fabric_clothes', label: 'Fabric / old clothes / uniforms' },
          { value: 'wood', label: 'Wood / pallets / furniture' },
          { value: 'tyres', label: 'Tyres / rubber' },
          { value: 'construction_debris', label: 'Construction debris / tiles' },
        ],
      },
      {
        name: 'goal',
        label: 'Primary goal',
        type: 'radio',
        required: true,
        options: [
          { value: 'earn_money', label: 'Earn money from recyclables' },
          { value: 'upcycle_diy', label: 'DIY upcycling / craft projects' },
          { value: 'donate', label: 'Donate to a good cause' },
          { value: 'reduce_waste', label: 'Simply reduce landfill' },
        ],
      },
      {
        name: 'volumeKgPerMonth',
        label: 'Approximate volume (kg/month)',
        type: 'slider',
        required: true,
        min: 1,
        max: 200,
        step: 1,
        defaultValue: 10,
      },
      {
        name: 'diySkillLevel',
        label: 'DIY / crafting skill level (if interested in upcycling)',
        type: 'select',
        required: false,
        options: [
          { value: 'beginner', label: 'Beginner' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'advanced', label: 'Advanced' },
        ],
        visibleWhen: { field: 'goal', equals: 'upcycle_diy' },
      },
      {
        name: 'hasTransport',
        label: 'Can you transport materials to a facility?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes_vehicle', label: 'Yes, I have a vehicle' },
          { value: 'yes_auto', label: 'Yes, via auto / tempo' },
          { value: 'no_pickup', label: 'No, needs doorstep pickup' },
        ],
      },
    ],
  },
  {
    slug: 'solar-energy',
    name: 'Rooftop Solar & Energy',
    description: 'Assess your rooftop solar potential and get actionable tips to cut energy bills and carbon footprint.',
    icon: 'Sun',
    category: 'Energy',
    promptFocus:
      'Focus on Indian solar policies (PM Surya Ghar Muft Bijli Yojana, net metering), rooftop area requirements, orientation, shading, typical system sizing (kW) and payback periods, DISCOM processes, state-specific subsidies, and practical energy efficiency measures.',
    fields: [
      {
        name: 'location',
        label: 'City / State',
        type: 'text',
        required: true,
        placeholder: 'e.g. Rajasthan, Gujarat, Tamil Nadu',
        maxLength: 80,
      },
      {
        name: 'propertyType',
        label: 'Property type',
        type: 'radio',
        required: true,
        options: [
          { value: 'independent_house', label: 'Independent house' },
          { value: 'apartment_flat', label: 'Apartment / flat' },
          { value: 'commercial', label: 'Commercial building / shop' },
          { value: 'industrial', label: 'Industrial / warehouse' },
        ],
      },
      {
        name: 'rooftopAreaSqFt',
        label: 'Available rooftop / terrace area (sq. ft.)',
        type: 'number',
        required: true,
        min: 50,
        max: 10000,
        placeholder: 'e.g. 300',
        helpText: 'Flat, unshaded area usable for panels.',
      },
      {
        name: 'monthlyBillRs',
        label: 'Average monthly electricity bill (₹)',
        type: 'number',
        required: true,
        min: 200,
        max: 200000,
        placeholder: 'e.g. 3000',
      },
      {
        name: 'ownership',
        label: 'Do you own the property?',
        type: 'radio',
        required: true,
        options: [
          { value: 'owned', label: 'Yes, owned' },
          { value: 'rented', label: 'No, rented' },
          { value: 'shared', label: 'Shared / co-owned' },
        ],
      },
      {
        name: 'shadingIssues',
        label: 'Shading issues on the rooftop',
        type: 'select',
        required: true,
        options: [
          { value: 'none', label: 'None — fully open sky' },
          { value: 'partial', label: 'Partial — some shadow in morning/evening' },
          { value: 'significant', label: 'Significant — trees or structures nearby' },
        ],
      },
      {
        name: 'budget',
        label: 'Rough budget for solar installation (₹)',
        type: 'select',
        required: false,
        options: [
          { value: 'under_1L', label: 'Under ₹1 Lakh' },
          { value: '1L_to_3L', label: '₹1–3 Lakh' },
          { value: '3L_to_5L', label: '₹3–5 Lakh' },
          { value: 'above_5L', label: 'Above ₹5 Lakh' },
          { value: 'not_sure', label: 'Not sure yet' },
        ],
      },
      {
        name: 'currentAppliances',
        label: 'High-power appliances in use',
        type: 'multiselect',
        required: false,
        options: [
          { value: 'ac', label: 'Air conditioner(s)' },
          { value: 'water_heater', label: 'Water heater / geyser' },
          { value: 'water_pump', label: 'Water pump / borewell' },
          { value: 'ev', label: 'Electric vehicle charger' },
          { value: 'heavy_machinery', label: 'Heavy machinery' },
        ],
      },
    ],
  },
];

export const getDomainBySlug = (slug: string): DomainConfig | undefined =>
  DOMAINS.find((d) => d.slug === slug);
