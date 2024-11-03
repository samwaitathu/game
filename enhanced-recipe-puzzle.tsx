import React, { useState, useEffect } from 'react';
import { ChefHat, Globe2, Sparkles, RefreshCcw, Clock, Users, HelpCircle, Trophy } from 'lucide-react';

const RecipePuzzle = () => {
  // Core game state
  const [language, setLanguage] = useState('english');
  const [draggedItem, setDraggedItem] = useState(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // New features state
  const [time, setTime] = useState(300); // 5 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1', score: 0, isCurrentTurn: true },
    { id: 2, name: 'Player 2', score: 0, isCurrentTurn: false }
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  
  // Sample recipe data with additional complexity
  const recipes = {
    english: {
      name: "Spaghetti Carbonara",
      ingredients: [
        { name: "Spaghetti", category: "pasta", points: 10 },
        { name: "Eggs", category: "protein", points: 15 },
        { name: "Pecorino Romano", category: "cheese", points: 20 },
        { name: "Guanciale", category: "meat", points: 25 },
        { name: "Black Pepper", category: "spice", points: 10 }
      ],
      hints: [
        "The main protein comes from both meat and eggs",
        "You'll need a hard Italian cheese",
        "Don't forget the classic black spice"
      ]
    },
    // Add more languages here
  };

  // Puzzle pieces and solution spaces state
  const [puzzlePieces, setPuzzlePieces] = useState([]);
  const [solutionSpaces, setSolutionSpaces] = useState([]);
  const [activeCategories, setActiveCategories] = useState(new Set());

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            handleTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, time]);

  // Initialize puzzle with difficulty settings
  useEffect(() => {
    initializePuzzle();
  }, [language, difficulty]);

  const initializePuzzle = () => {
    const currentRecipe = recipes[language];
    let ingredients = [...currentRecipe.ingredients];
    
    // Add complexity based on difficulty
    if (difficulty === 'hard') {
      // Add decoy ingredients
      const decoys = [
        { name: "Cream", category: "dairy", points: -10 },
        { name: "Garlic", category: "vegetable", points: -10 }
      ];
      ingredients = [...ingredients, ...decoys];
    }

    const shuffled = ingredients
      .sort(() => Math.random() - 0.5)
      .map((ingredient, index) => ({
        id: index,
        ...ingredient,
        isPlaced: false
      }));
    
    setPuzzlePieces(shuffled);
    setSolutionSpaces(Array(currentRecipe.ingredients.length).fill(null));
    setActiveCategories(new Set(ingredients.map(i => i.category)));
  };

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    // Switch to next player
    switchPlayer();
  };

  const switchPlayer = () => {
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextPlayerIndex);
    
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === nextPlayerIndex
    }));
    setPlayers(updatedPlayers);
    
    // Reset timer for next player
    setTime(300);
    setIsTimerRunning(true);
  };

  const useHint = () => {
    if (hintsRemaining > 0) {
      setHintsRemaining(prev => prev - 1);
      setShowHint(true);
      // Reduce score for using hint
      setScore(prev => Math.max(0, prev - 10));
      setTimeout(() => setShowHint(false), 5000);
    }
  };

  const handleDragStart = (item) => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }
    setDraggedItem(item);
  };

  const handleDrop = (index) => {
    if (!draggedItem || solutionSpaces[index] !== null) return;

    const currentRecipe = recipes[language];
    const isCorrectPosition = currentRecipe.ingredients[index].name === draggedItem.name;
    
    const newSolutionSpaces = [...solutionSpaces];
    newSolutionSpaces[index] = draggedItem;

    const newPuzzlePieces = puzzlePieces.map(piece => 
      piece.id === draggedItem.id ? { ...piece, isPlaced: true } : piece
    );

    setSolutionSpaces(newSolutionSpaces);
    setPuzzlePieces(newPuzzlePieces);
    setDraggedItem(null);

    // Update score based on placement
    if (isCorrectPosition) {
      const pointsEarned = draggedItem.points;
      const timeBonus = Math.floor(time / 10);
      const totalPoints = pointsEarned + timeBonus;
      
      // Update current player's score
      const updatedPlayers = players.map(player => 
        player.isCurrentTurn ? 
        { ...player, score: player.score + totalPoints } : 
        player
      );
      setPlayers(updatedPlayers);
    } else {
      // Penalty for incorrect placement
      const updatedPlayers = players.map(player => 
        player.isCurrentTurn ? 
        { ...player, score: Math.max(0, player.score - 5) } : 
        player
      );
      setPlayers(updatedPlayers);
    }

    // Check puzzle completion
    checkPuzzleCompletion(newSolutionSpaces);
  };

  const checkPuzzleCompletion = (currentSolutionSpaces) => {
    const currentRecipe = recipes[language];
    const isAllPlaced = currentSolutionSpaces.every(space => space !== null);
    const isCorrect = currentSolutionSpaces.every((space, idx) => 
      space?.name === currentRecipe.ingredients[idx].name
    );

    if (isAllPlaced && isCorrect) {
      setIsComplete(true);
      setIsTimerRunning(false);
      // Bonus points for completion
      const timeBonus = Math.floor(time / 2);
      const updatedPlayers = players.map(player => 
        player.isCurrentTurn ? 
        { ...player, score: player.score + 100 + timeBonus } : 
        player
      );
      setPlayers(updatedPlayers);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with expanded controls */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <ChefHat className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-amber-900">
              {recipes[language].name}
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Timer */}
            <div className="bg-amber-100 px-4 py-2 rounded-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-900">{formatTime(time)}</span>
            </div>
            
            {/* Difficulty Selector */}
            <select 
              className="px-4 py-2 rounded-lg border border-amber-200 bg-white"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Hint Button */}
            <button 
              onClick={useHint}
              className="bg-amber-100 px-4 py-2 rounded-lg flex items-center gap-2"
              disabled={hintsRemaining === 0}
            >
              <HelpCircle className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-900">
                Hints: {hintsRemaining}
              </span>
            </button>
          </div>
        </div>

        {/* Player Scores */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {players.map((player) => (
            <div 
              key={player.id}
              className={`p-4 rounded-lg ${
                player.isCurrentTurn ? 'bg-amber-200' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-amber-900">{player.name}</span>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                  {player.score}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Hint Display */}
        {showHint && (
          <div className="bg-blue-100 p-4 rounded-lg mb-8">
            <p className="text-blue-800">
              Hint: {recipes[language].hints[2 - hintsRemaining]}
            </p>
          </div>
        )}

        {/* Puzzle Area */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          {/* Category Labels */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from(activeCategories).map(category => (
              <span 
                key={category}
                className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm"
              >
                {category}
              </span>
            ))}
          </div>

          {/* Solution Spaces */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            {solutionSpaces.map((space, index) => (
              <div
                key={index}
                className={`h-16 rounded-lg border-2 border-dashed 
                  ${space ? 
                    space.name === recipes[language].ingredients[index].name ?
                    'border-green-500 bg-green-50' : 
                    'border-red-500 bg-red-50'
                    : 'border-amber-200'
                  } 
                  flex items-center justify-center`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
              >
                {space && (
                  <div className="text-center">
                    <span className="text-lg font-medium">
                      {space.name}
                    </span>
                    <span className="text-sm block">
                      {space.category}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Puzzle Pieces */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {puzzlePieces.map((piece) => !piece.isPlaced && (
              <div
                key={piece.id}
                className="bg-amber-100 p-4 rounded-lg cursor-move"
                draggable
                onDragStart={() => handleDragStart(piece)}
              >
                <div className="text-center">
                  <span className="text-lg font-medium text-amber-900">
                    {piece.name}
                  </span>
                  <span className="text-sm block text-amber-700">
                    {piece.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Modal */}
        {isComplete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl text-center max-w-md">
              <Trophy className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-900 mb-4">
                Puzzle Complete!
              </h2>
              
              {/* Final Scores */}
              <div className="space-y-2 mb-6">
                {players.map(player => (
                  <div key={player.id} className="flex justify-between items-center">
                    <span>{player.name}</span>
                    <span className="font-bold">{player.score} points</span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={initializePuzzle}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipePuzzle;
