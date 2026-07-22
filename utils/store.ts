import { IMAGES } from '../assets/images';

export interface User {
  name: string;
  phone: string;
  address: string;
  isAdmin: boolean;
}

export interface Delivery {
  id: string;
  name: string;
  phone?: string;
  address: string;
  paperName: string;
  src: any;
  status: 'Pending' | 'Delivered' | 'Skipped';
  time: string;
  priceDay?: number;
  priceMonth?: number;
  plan?: string;
  startDate?: string;
  days?: string[];
  paymentMethod?: string;
}

export interface Newspaper {
  id: string;
  name: string;
  language: string;
  priceDay: number;
  priceMonth: number;
  rating: number;
  src: any;
}

// Initial state
let currentUser: User | null = null;

let availablePapers: Newspaper[] = [
  { id: '1', name: 'Vijayavani', language: 'Kannada', priceDay: 6, priceMonth: 180, rating: 4.6, src: IMAGES.vijayavani },
  { id: '2', name: 'Prajavani', language: 'Kannada', priceDay: 7, priceMonth: 210, rating: 4.5, src: IMAGES.prajavani },
  { id: '3', name: 'The Hindu', language: 'English', priceDay: 10, priceMonth: 300, rating: 4.7, src: IMAGES.theHindu },
  { id: '4', name: 'Times of India', language: 'English', priceDay: 8, priceMonth: 240, rating: 4.3, src: IMAGES.timesOfIndia },
  { id: '5', name: 'Dinamalar', language: 'Tamil', priceDay: 6, priceMonth: 160, rating: 4.4, src: IMAGES.vijayavani },
  { id: '6', name: 'Dainik Bhaskar', language: 'Hindi', priceDay: 5, priceMonth: 150, rating: 4.2, src: IMAGES.prajavani },
];

let adminNumbers: string[] = ['8123363394', '9972505709'];

let deliveries: Delivery[] = [
  {
    id: 'c1',
    name: 'Shivakumar',
    address: 'Koramangala, #42, 4th Block',
    paperName: 'Vijayavani',
    src: IMAGES.vijayavani,
    status: 'Pending',
    time: '5:30 AM',
    priceDay: 6,
    priceMonth: 180,
    plan: 'Monthly',
    startDate: '25 Jul 2025',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  {
    id: 'c2',
    name: 'Anjali Sharma',
    address: 'HSR Layout, Sector 3, #112',
    paperName: 'The Hindu',
    src: IMAGES.theHindu,
    status: 'Delivered',
    time: '5:15 AM',
    priceDay: 10,
    priceMonth: 300,
    plan: 'Monthly',
    startDate: '20 Jul 2025',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    id: 'c3',
    name: 'Ramesh Gowda',
    address: 'Indiranagar, 100ft Rd, #88',
    paperName: 'Prajavani',
    src: IMAGES.prajavani,
    status: 'Skipped',
    time: 'Paused',
    priceDay: 7,
    priceMonth: 210,
    plan: 'Monthly',
    startDate: '10 Jul 2025',
    days: ['Monday', 'Wednesday', 'Friday'],
  },
];

const listeners = new Set<() => void>();

export const store = {
  getUser() {
    return currentUser;
  },
  setUser(user: User | null) {
    currentUser = user;
    this.notify();
  },
  getDeliveries() {
    return deliveries;
  },
  getPapers() {
    return availablePapers;
  },
  addPaper(paper: Omit<Newspaper, 'id' | 'rating'>) {
    const newPaper: Newspaper = {
      ...paper,
      id: 'paper_' + Date.now(),
      rating: 4.5, // Default rating for new papers
    };
    availablePapers = [newPaper, ...availablePapers];
    this.notify();
  },
  addSubscription(sub: {
    paperName: string;
    plan: string;
    priceDay: number;
    priceMonth: number;
    startDate: string;
    days: string[];
    imageSource: any;
    paymentMethod: string;
  }) {
    if (!currentUser) return;
    const newDelivery: Delivery = {
      id: 'sub_' + Date.now(),
      name: currentUser.name,
      phone: currentUser.phone,
      address: currentUser.address || 'Koramangala, Bengaluru',
      paperName: sub.paperName,
      src: sub.imageSource,
      status: 'Pending',
      time: '5:30 AM',
      priceDay: sub.priceDay,
      priceMonth: sub.priceMonth,
      plan: sub.plan,
      startDate: sub.startDate,
      days: sub.days,
      paymentMethod: sub.paymentMethod,
    };
    deliveries = [newDelivery, ...deliveries];
    this.notify();
  },
  updateDeliveryStatus(id: string, status: 'Pending' | 'Delivered' | 'Skipped') {
    deliveries = deliveries.map(d => d.id === id ? { ...d, status } : d);
    this.notify();
  },
  getAdminNumbers() {
    return adminNumbers;
  },
  addAdminNumber(phone: string) {
    if (!adminNumbers.includes(phone)) {
      adminNumbers = [...adminNumbers, phone];
      this.notify();
    }
  },
  removeAdminNumber(phone: string) {
    adminNumbers = adminNumbers.filter((n) => n !== phone);
    this.notify();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  notify() {
    listeners.forEach((l) => l());
  },
};
