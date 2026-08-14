import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { 
  IVOIRIAN_CITIES as INITIAL_CITIES, 
  INITIAL_MERCHANTS, 
  INITIAL_PRODUCTS, 
  INITIAL_LIVREURS, 
  INITIAL_TARIFFS, 
  INITIAL_ORDERS 
} from './src/data/mockData';
import { Order, OrderStatus, Product, Livreur, ProofOfDelivery, Merchant } from './src/types';

dotenv.config();

// Shared state in memory
let orders: Order[] = [...INITIAL_ORDERS];
let products: Product[] = [...INITIAL_PRODUCTS];
let livreurs: Livreur[] = [...INITIAL_LIVREURS];
let merchants: Merchant[] = [...INITIAL_MERCHANTS];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Ivoire Delivery', time: new Date().toISOString() });
  });

  // Get orders
  app.get('/api/orders', (req, res) => {
    res.json(orders);
  });

  // Create order
  app.post('/api/orders', (req, res) => {
    const newOrder: Order = req.body;
    orders.unshift(newOrder);
    res.status(201).json(newOrder);
  });

  // Update order status or proof
  app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status, proof, assignedLivreur } = req.body;
    
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      if (status) orders[index].status = status as OrderStatus;
      if (proof) {
        orders[index].proof = { ...orders[index].proof, ...proof };
      }
      if (assignedLivreur) {
        orders[index].assignedLivreur = assignedLivreur;
      }
      res.json(orders[index]);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  // Get livreurs
  app.get('/api/livreurs', (req, res) => {
    res.json(livreurs);
  });

  // Update livreur status / position
  app.patch('/api/livreurs/:id', (req, res) => {
    const { id } = req.params;
    const { status, walletFCFA, currentLat, currentLng } = req.body;
    
    const index = livreurs.findIndex(l => l.id === id);
    if (index !== -1) {
      if (status) livreurs[index].status = status;
      if (walletFCFA !== undefined) livreurs[index].walletFCFA = walletFCFA;
      if (currentLat !== undefined) livreurs[index].currentLat = currentLat;
      if (currentLng !== undefined) livreurs[index].currentLng = currentLng;
      res.json(livreurs[index]);
    } else {
      res.status(404).json({ error: 'Livreur not found' });
    }
  });

  // Get products
  app.get('/api/products', (req, res) => {
    res.json(products);
  });

  // Add product
  app.post('/api/products', (req, res) => {
    const newProduct: Product = req.body;
    products.unshift(newProduct);
    res.status(201).json(newProduct);
  });

  // Get merchants
  app.get('/api/merchants', (req, res) => {
    res.json(merchants);
  });

  // Add merchant
  app.post('/api/merchants', (req, res) => {
    const newMerchant: Merchant = req.body;
    merchants.unshift(newMerchant);
    res.status(201).json(newMerchant);
  });

  // --- GEMINI AI ROUTE: Smart Grouping Analysis ---
  app.post('/api/gemini/smart-grouping', async (req, res) => {
    try {
      const { items, destinationCity } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          aiAnalysis: "Analyse intelligente basée sur les hubs Ivoire Delivery : Regrouper ces articles permet d'économiser environ 30% sur les frais de livraison grâce à notre hub central à Bouaké.",
          recommendedRoute: "Commerçants locaux -> Hub Central Bouaké -> Tournée unique"
        });
      }

      const prompt = `Tu es l'algorithme d'optimisation logistique d'Ivoire Delivery (plateforme de livraison nationale en Côte d'Ivoire).
Voici les articles du panier client à livrer vers la ville de destination : "${destinationCity}".
Articles : ${JSON.stringify(items)}

Génère une analyse synthétique et professionnelle en français (max 3 phrases) expliquant :
1. Comment le regroupement intelligent d'articles (ex: chaussures + parfum + téléphone + repas) minimise le nombre de livreurs et le coût total en FCFA.
2. Le trajet/hub stratégique optimisé (passant éventuellement par le hub central de Bouaké, Korhogo, Yamoussoukro ou Daloa).
3. L'impact écologique/gain de temps.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      res.json({
        aiAnalysis: response.text || "Analyse logistique générée.",
      });
    } catch (err: any) {
      console.error('Gemini Smart Grouping Error:', err);
      res.json({
        aiAnalysis: "Suggère un regroupement via le hub de Bouaké pour réduire l'empreinte carbone et diminuer les frais de livraison de 30%.",
      });
    }
  });

  // --- GEMINI AI ROUTE: Support & Tariff Assistant ---
  app.post('/api/gemini/support', async (req, res) => {
    try {
      const { question } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          answer: "Bienvenue sur Ivoire Delivery ! Nous couvrons Bouaké, Korhogo, Yamoussoukro, Daloa, San-Pédro, Man et Abidjan. Nos livraisons s'effectuent par Express ou Programmée, avec vérification par code OTP et paiements Wave/Mobile Money."
        });
      }

      const prompt = `Tu es l'assistant officiel d'Ivoire Delivery, la plateforme de livraison intelligente en Côte d'Ivoire.
Villes couvertes : Bouaké (hub d'origine), Korhogo, Yamoussoukro, Daloa, San-Pédro, Man, Abidjan, Gagnoa.
Moyens de paiement : Wave, Orange Money, MTN Mobile Money, Moov, Espèces.
Sécurité : Preuve de livraison avec code OTP 4 chiffres, photo du colis et signature sur écran.
Rôles : Clients, Commerçants, Livreurs.

Question de l'utilisateur : "${question}"

Réponds de manière chaleureuse, précise et professionnelle en français avec les spécificités ivoiriennes.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      res.json({
        answer: response.text || "Assistant Ivoire Delivery à votre service !",
      });
    } catch (err: any) {
      console.error('Gemini Support Error:', err);
      res.json({
        answer: "Désolé, une erreur s'est produite. Vous pouvez contacter le service client Ivoire Delivery au +225 07 00 00 00 00.",
      });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ivoire Delivery server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
