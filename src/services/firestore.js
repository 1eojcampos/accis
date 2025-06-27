import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Printer Listings
export const createPrinterListing = async (userId, printerData) => {
  try {
    const docRef = await addDoc(collection(db, 'printers'), {
      ...printerData,
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating printer listing:', error);
    throw error;
  }
};

export const updatePrinterListing = async (printerId, updates) => {
  try {
    const printerRef = doc(db, 'printers', printerId);
    await updateDoc(printerRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating printer listing:', error);
    throw error;
  }
};

export const deletePrinterListing = async (printerId) => {
  try {
    await deleteDoc(doc(db, 'printers', printerId));
  } catch (error) {
    console.error('Error deleting printer listing:', error);
    throw error;
  }
};

export const getAllPrinters = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'printers'), where('isActive', '==', true))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting printers:', error);
    throw error;
  }
};

export const getPrintersByOwner = async (ownerId) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'printers'), 
        where('ownerId', '==', ownerId),
        where('isActive', '==', true)
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting printer listings:', error);
    throw error;
  }
};

// Print Requests
export const createPrintRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'printRequests'), {
      ...requestData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating print request:', error);
    throw error;
  }
};

export const updatePrintRequestStatus = async (requestId, status, updates = {}) => {
  try {
    const requestRef = doc(db, 'printRequests', requestId);
    await updateDoc(requestRef, {
      status,
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating print request:', error);
    throw error;
  }
};

export const getPrintRequestsForPrinter = async (printerId) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'printRequests'),
        where('printerId', '==', printerId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting print requests for printer:', error);
    throw error;
  }
};

export const getPrintRequestsForCustomer = async (customerId) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'printRequests'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting print requests for customer:', error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToPrintRequests = (printerId, callback) => {
  const q = query(
    collection(db, 'printRequests'),
    where('printerId', '==', printerId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(requests);
  });
};

export const subscribeToCustomerRequests = (customerId, callback) => {
  const q = query(
    collection(db, 'printRequests'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(requests);
  });
};

// User profiles
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};
