import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

// Function to search locations based on a search text
export const searchLocations = async (searchText) => {
  try {
    const locationsRef = collection(db, "locations");
    const q = query(
      locationsRef,
      where("searchTerms", "array-contains", searchText.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map((doc) => doc.data());
    return results;
  } catch (error) {
    console.error("Error searching for locations:", error);
    throw error;
  }
};