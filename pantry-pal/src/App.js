import React, { useState, useEffect } from 'react';
import './App.css';

import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from './firebase';

import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function signUpUser(e) {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log("Signed up successfully");
        navigate("/login");
      })
      .catch((error) => {
        console.error(error.message);
      });
  }

  return (
    <div className="form-container">
      <h1>Sign Up</h1>
      <form onSubmit={signUpUser}>
        <label htmlFor="email">Email: </label>
        <input
          value={email}
          id="email"
          name="email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password: </label>
        <input
          value={password}
          id="password"
          name="password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign up</button>
      </form>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function loginUser(e) {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log("Logged in successfully");
        navigate("/");
      })
      .catch((error) => {
        console.error(error.message);
      });
  }

  return (
    <div className="form-container">
      <h1>Log in</h1>
      <form onSubmit={loginUser}>
        <label htmlFor="email">Email: </label>
        <input
          value={email}
          id="email"
          name="email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password: </label>
        <input
          value={password}
          id="password"
          name="password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Log in</button>
        <p>
          New user? Sign up <Link to="/signup">here</Link>
        </p>
      </form>
    </div>
  );
}

function Home() {
  const [ingredients, setIngredients] = useState([""]);
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [diet, setDiet] = useState("");
  const [viewFavorites, setViewFavorites] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const apiKey = "a253033e1e6844d58cd5cd33f253da27";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            favorites: [],
            ingredients: [""],
            diet: "",
          });
        }
      } else {
        setUser(null);
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    saveUserData();
  }, [favorites, ingredients, diet]);

  async function fetchUserData() {
    if (user) {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFavorites(data.favorites || []);
          setIngredients(data.ingredients || [""]);
          setDiet(data.diet || "");
          console.log("User data fetched successfully");
        } else {
          console.log("No data found for this user");
        }
      } catch (e) {
        console.error("Error fetching user data: ", e);
      }
    }
  }

  async function saveUserData() {
    if (user) {
      try {
        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, {
          favorites,
          ingredients,
          diet,
        });
        console.log("User data saved successfully");
      } catch (e) {
        console.error("Error saving user data: ", e);
      }
    }
  }

  const signOutUser = () => {
    auth.signOut()
      .then(() => {
        console.log("User signed out successfully");
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  const handleFavorite = (recipe) => {
    const updatedFavorites = favorites.find((fav) => fav.id === recipe.id)
      ? favorites.filter((fav) => fav.id !== recipe.id)
      : [...favorites, recipe];
    setFavorites(updatedFavorites);
  };

  const handleIngredientChange = (index, value) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = value;
    setIngredients(updatedIngredients);
  };

  const addIngredient = () => setIngredients([...ingredients, ""]);
  const removeIngredient = (index) => {
    const updatedIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(updatedIngredients);
  };

  const fetchRecipes = async () => {
    const formattedIngredients = ingredients.join(",");
    const url = `https://api.spoonacular.com/recipes/complexSearch?includeIngredients=${formattedIngredients}&diet=${diet}&number=10&apiKey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      setRecipes(data.results || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  const toggleExpandedRecipe = async (recipeId) => {
    if (expandedRecipe && expandedRecipe.id === recipeId) {
      setExpandedRecipe(null);
    } else {
      try {
        const url = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=false&apiKey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        setExpandedRecipe(data);
      } catch (error) {
        console.error("Error fetching recipe details:", error);
      }
    }
  };

  return (
    <div className="App">
      <h1>Pantry Pal</h1>
      <p className="intro-text">
        Welcome to Pantry Pal! This app helps you find recipes based on the ingredients you have at home. 
        Simply enter your ingredients, choose a dietary preference (if applicable), and click "Find Recipes" 
        to explore delicious meal ideas. Favorite the ones you like for easy access later!
      </p>
      <button className="favorites-button" onClick={() => setViewFavorites(!viewFavorites)}>
        {viewFavorites ? "Back to Recipes" : "View Favorited Recipes"}
      </button>
      {!viewFavorites && (
        <div className="input-section">
          <div className="ingredients-section">
            <h2>Enter Ingredients:</h2>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-input">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  placeholder={`Ingredient ${index + 1}`}
                />
                <button onClick={() => removeIngredient(index)}>Remove</button>
              </div>
            ))}
            <button className="add-ingredient-button" onClick={addIngredient}>Add Ingredient</button>
          </div>
          <div className="diet-section">
            <h2>Filter by Dietary Preference:</h2>
            <select onChange={(e) => setDiet(e.target.value)}>
              <option value="">All</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="glutenFree">Gluten-Free</option>
            </select>
          </div>
        </div>
      )}
      {!viewFavorites && <button className="find-recipes-button" onClick={fetchRecipes}>Find Recipes</button>}
      <RecipeList
        recipes={viewFavorites ? favorites : recipes}
        onFavorite={handleFavorite}
        toggleExpandedRecipe={toggleExpandedRecipe}
        expandedRecipe={expandedRecipe}
        favorites={favorites}
      />
      <button className="sign-out" onClick={signOutUser}>Sign Out</button>
    </div>
  );
}

function RecipeList({ recipes, onFavorite, toggleExpandedRecipe, expandedRecipe, favorites }) {
  return (
    <div className="recipe-list">
      <h2>Recipes:</h2>
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="recipe-card">
            <h3>{recipe.title}</h3>
            <img src={recipe.image} alt={recipe.title} />
            <button
              className={`favorite-button ${favorites.find((fav) => fav.id === recipe.id) ? 'favorited' : ''}`}
              onClick={() => onFavorite(recipe)}
            >
              {favorites.find((fav) => fav.id === recipe.id) ? 'Unfavorite' : 'Favorite'}
            </button>
            <button onClick={() => toggleExpandedRecipe(recipe.id)}>
              {expandedRecipe && expandedRecipe.id === recipe.id ? 'Collapse' : 'Expand'}
            </button>
            {expandedRecipe && expandedRecipe.id === recipe.id && (
              <div className="recipe-details">
                <h4>Ingredients:</h4>
                <ul>
                  {expandedRecipe.extendedIngredients.map((ing) => (
                    <li key={ing.id}>{ing.original}</li>
                  ))}
                </ul>
                <h4>Instructions:</h4>
                <ol>
                  {expandedRecipe.analyzedInstructions[0]?.steps.map((step) => (
                    <li key={step.number}>{step.step}</li>
                  )) || <p>No instructions available.</p>}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export { App, Signup };
export default App;
