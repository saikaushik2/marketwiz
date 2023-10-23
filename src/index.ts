import express from "express";
import {getFirestore, collection, doc,setDoc, updateDoc, getDocs, getDoc} from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import dotenv from 'dotenv';
import http from 'https';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.APPKEY,
    authDomain: process.env.AUTHDOMAIN,
    projectId: process.env.PROJECTID,
    storageBucket: process.env.STORAGEBUCKET,
    messagingSenderId: process.env.MESSAGINGSENDER,
    appId: process.env.APPID,
    measurementId: process.env.MESUREMENTID
};

const fireBaseApp = initializeApp(firebaseConfig);
const db = getFirestore(fireBaseApp);

// firebase document
const Users = doc(collection(db, "Users"));

// Define a User interface
interface User {
    email: string;
    password?: string;
    displayName: string;
}

const app = express();

app.use(express.json());

// get users
app.get('/', async (req: any, res: any) => {
    try {
      const usersSnapshot = await getDocs(collection(db, "Users"));
      const users: User[] = [];
  
      usersSnapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
  
      res.send({ message: 'Users retrieved successfully', users });
    } catch (error:any) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
});

// create users
app.post('/create', async (req:any, res:any) => {
    try {
      const { email, displayName, password }: User = req.body;
      const data: User = {email, displayName, password};
  
      await setDoc(Users, data);
      res.send({message: 'User saved', user: data})
  
    } catch (error:any) {
      res.status(400).json({ message: 'Bad request', error: error.message });
    }
});

// get a user
app.get('/user/:userId', async (req: any, res: any) => {
    try {
      const userId = req.params.userId;
      const userRef = doc(collection(db, "Users"), userId);
      const userSnapshot = await getDoc(userRef);
  
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data() as User;
        res.send({ message: 'User retrieved successfully', user: userData });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error:any) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  
  // update user
  app.put('/user/:userId', async (req: any, res: any) => {
    try {
      const userId = req.params.userId;
      const { email, displayName, password }: User = req.body;
      const userRef = doc(collection(db, "Users"), userId);
      const updatedUser: Partial<User> = {};
  
      if (email !== undefined) {
        updatedUser.email = email;
      }
      if (displayName !== undefined) {
        updatedUser.displayName = displayName;
      }
      if (password !== undefined) {
        updatedUser.password = password;
      }
  
      await updateDoc(userRef, updatedUser);
      res.send({ message: 'User updated successfully', user: updatedUser });
    } catch (error:any) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  
  // search
  let extUrl = process.env.EXT_URL;
  let searchHits = 0;
  app.get('/search', async (req: any, res: any) => {
    try {
      searchHits++;
      const { q } = req.query;
      http.get(`${extUrl}&srsearch=${q}`, (response: any) => {
        let data = '';      
        response.on('data', (chunk: any) => {
          data += chunk;
        });
  
        response.on('end', () => {
          try {
            const searchResults = JSON.parse(data).query.search;
            searchResults.forEach((result: any) => {
              result.snippet = result.snippet.replace(/<[^>]*>/g, ''); // Remove HTML tags
            });
            
            // construct output
            const responseObject = {
              numberOfHits: searchHits,
              firstHit: searchResults.length > 0 ? searchResults[0].snippet : '', // First result's snippet
            };
  
            res.send({ message: 'Search results retrieved successfully', results: responseObject });
          } catch (error:any) {
            res.status(500).json({ message: 'An error occurred', error: error.message });
          }
        });
      });
    } catch (error:any) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });

// Start the Express server
app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});