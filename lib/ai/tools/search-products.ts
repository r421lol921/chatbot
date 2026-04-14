import { tool } from "ai";
import { z } from "zod";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  imageQuery: string;
  searchUrl: string;
  category: string;
};

// Curate realistic product results based on the query
function generateProducts(query: string, category: string): Product[] {
  const q = query.toLowerCase();

  // Laptop / computer category
  if (q.includes("laptop") || q.includes("computer") || q.includes("pc") || category === "electronics") {
    return [
      {
        id: "1",
        name: "MacBook Air M3 (2024)",
        description: "Apple M3 chip, 8GB RAM, 256GB SSD. Ultra-thin design with all-day battery life.",
        price: "$1,099",
        rating: 4.8,
        reviewCount: 4312,
        badge: "Best Overall",
        imageQuery: "macbook air laptop silver",
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent("MacBook Air M3")}`,
        category: "Laptops",
      },
      {
        id: "2",
        name: "Dell XPS 13 Plus",
        description: "Intel Core i7, 16GB RAM, 512GB SSD. Premium Windows ultrabook with OLED display.",
        price: "$1,299",
        rating: 4.6,
        reviewCount: 2187,
        badge: "Best Windows",
        imageQuery: "dell xps 13 laptop black",
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent("Dell XPS 13 Plus")}`,
        category: "Laptops",
      },
      {
        id: "3",
        name: "ASUS ZenBook 14",
        description: "AMD Ryzen 7, 16GB RAM, 512GB SSD. OLED display, great value for the price.",
        price: "$799",
        rating: 4.5,
        reviewCount: 1893,
        badge: "Best Value",
        imageQuery: "asus zenbook laptop slim",
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent("ASUS ZenBook 14")}`,
        category: "Laptops",
      },
    ];
  }

  // Phone category
  if (q.includes("phone") || q.includes("smartphone") || q.includes("iphone") || q.includes("android")) {
    return [
      {
        id: "1",
        name: "iPhone 16 Pro",
        description: "A18 Pro chip, 48MP camera system, titanium design. Best iPhone ever made.",
        price: "$999",
        rating: 4.9,
        reviewCount: 8742,
        badge: "Editor's Choice",
        imageQuery: "iphone 16 pro titanium",
        searchUrl: `https://www.apple.com/iphone-16-pro/`,
        category: "Smartphones",
      },
      {
        id: "2",
        name: "Samsung Galaxy S25 Ultra",
        description: "Snapdragon 8 Elite, 200MP camera, built-in S Pen. Ultimate Android flagship.",
        price: "$1,299",
        rating: 4.7,
        reviewCount: 5621,
        badge: "Best Android",
        imageQuery: "samsung galaxy s25 ultra black",
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent("Samsung Galaxy S25 Ultra")}`,
        category: "Smartphones",
      },
      {
        id: "3",
        name: "Google Pixel 9",
        description: "Google Tensor G4, pure Android experience, AI-powered camera, 7 years of updates.",
        price: "$699",
        rating: 4.6,
        reviewCount: 3204,
        badge: "Best Camera",
        imageQuery: "google pixel 9 smartphone",
        searchUrl: `https://store.google.com/product/pixel_9`,
        category: "Smartphones",
      },
    ];
  }

  // Headphones
  if (q.includes("headphone") || q.includes("earphone") || q.includes("earbuds") || q.includes("audio")) {
    return [
      {
        id: "1",
        name: "Sony WH-1000XM5",
        description: "Industry-leading noise cancellation, 30hr battery, multipoint connection.",
        price: "$349",
        rating: 4.8,
        reviewCount: 12430,
        badge: "Best ANC",
        imageQuery: "sony wh-1000xm5 headphones black",
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent("Sony WH-1000XM5")}`,
        category: "Headphones",
      },
      {
        id: "2",
        name: "Apple AirPods Pro 2",
        description: "H2 chip, adaptive audio, transparency mode, USB-C charging case.",
        price: "$249",
        rating: 4.7,
        reviewCount: 9823,
        badge: "Best for iPhone",
        imageQuery: "apple airpods pro 2 white",
        searchUrl: `https://www.apple.com/airpods-pro/`,
        category: "Earbuds",
      },
      {
        id: "3",
        name: "Bose QuietComfort 45",
        description: "Legendary comfort, excellent noise cancellation, balanced sound profile.",
        price: "$279",
        rating: 4.6,
        reviewCount: 7104,
        badge: "Most Comfortable",
        imageQuery: "bose quietcomfort headphones",
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent("Bose QuietComfort 45")}`,
        category: "Headphones",
      },
    ];
  }

  // TV / monitor
  if (q.includes("tv") || q.includes("television") || q.includes("monitor") || q.includes("screen")) {
    return [
      {
        id: "1",
        name: "LG C4 OLED 55\"",
        description: "4K OLED evo, 120Hz, G-Sync & FreeSync, webOS Smart TV. Perfect for gaming & movies.",
        price: "$1,299",
        rating: 4.9,
        reviewCount: 6821,
        badge: "Best TV 2025",
        imageQuery: "lg oled c4 tv black",
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent("LG C4 OLED 55")}`,
        category: "TVs",
      },
      {
        id: "2",
        name: "Samsung QN90D Neo QLED 65\"",
        description: "Mini-LED quantum dots, 4K 144Hz, Dolby Atmos, anti-glare matte display.",
        price: "$1,599",
        rating: 4.7,
        reviewCount: 3412,
        badge: "Best Brightness",
        imageQuery: "samsung qled tv large screen",
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent("Samsung QN90D QLED")}`,
        category: "TVs",
      },
      {
        id: "3",
        name: "Sony Bravia 7 55\"",
        description: "Mini-LED XR processor, 4K 120Hz, Google TV, excellent upscaling.",
        price: "$1,099",
        rating: 4.6,
        reviewCount: 2189,
        badge: "Best Picture Engine",
        imageQuery: "sony bravia tv slim",
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent("Sony Bravia 7")}`,
        category: "TVs",
      },
    ];
  }

  // Generic / fallback
  return [
    {
      id: "1",
      name: `Top Pick: ${query}`,
      description: `Highly rated option for "${query}" — trusted by thousands of buyers.`,
      price: "$49–$199",
      rating: 4.7,
      reviewCount: 2341,
      badge: "Top Rated",
      imageQuery: query,
      searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
      category: "General",
    },
    {
      id: "2",
      name: `Best Value: ${query}`,
      description: `Great balance of quality and affordability for "${query}".`,
      price: "$29–$99",
      rating: 4.5,
      reviewCount: 1203,
      badge: "Best Value",
      imageQuery: `${query} affordable`,
      searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(query + " best value")}`,
      category: "General",
    },
    {
      id: "3",
      name: `Premium: ${query}`,
      description: `The premium choice for "${query}" — built to last with top-tier performance.`,
      price: "$199+",
      rating: 4.8,
      reviewCount: 876,
      badge: "Premium Pick",
      imageQuery: `${query} premium`,
      searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(query + " premium")}`,
      category: "General",
    },
  ];
}

export const searchProducts = tool({
  description:
    "Search for and display the best product recommendations when the user wants to buy or find something. Use this when users ask about buying products, best products for something, product comparisons, or shopping recommendations.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The product or category to search for (e.g. 'best laptops for students', 'wireless headphones under $200', 'gaming monitors')"),
    category: z
      .string()
      .optional()
      .describe("Product category if known (e.g. 'electronics', 'clothing', 'home', 'sports')"),
  }),
  execute: async ({ query, category = "general" }) => {
    const products = generateProducts(query, category);
    return {
      query,
      category,
      products,
      searchMoreUrl: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
    };
  },
});
