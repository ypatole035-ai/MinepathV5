import React, { useState, useCallback } from 'react';
import HomeScreen        from './components/HomeScreen';
import GameplayScreen    from './components/GameplayScreen';
import GameOverScreen    from './components/GameOverScreen';
import ShopScreen        from './components/ShopScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import AchievementsScreen from './components/AchievementsScreen';
import WorldSelectScreen from './components/WorldSelectScreen';
import { gameStore }     from './store/gameStore';
import './styles/game.css';

export default function App() {
  const [screen,       setScreen]       = useState('home');
  const [gameOverData, setGameOverData] = useState({ level:1, seeds:0, combo:0 });
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isEndless,    setIsEndless]    = useState(false);

  const goHome       = useCallback(() => { setCurrentLevel(1); setIsEndless(false); setScreen('home'); }, []);
  const goPlay       = useCallback(() => {
    const saved = gameStore.getSavedLevel();
    setCurrentLevel(saved > 0 ? saved : 1);
    setIsEndless(false);
    setScreen('game');
  }, []);
  const goEndless    = useCallback(() => {
    setCurrentLevel(1);
    setIsEndless(true);
    setScreen('game');
  }, []);
  const goWorldSelect = useCallback(() => setScreen('worldselect'), []);
  const goShop        = useCallback(() => setScreen('shop'), []);
  const goLeaderboard   = useCallback(() => setScreen('leaderboard'), []);
  const goAchievements  = useCallback(() => setScreen('achievements'), []);

  const handleGameOver = useCallback((data) => {
    setGameOverData({ level:1, seeds:0, combo:0, ...data });
    setScreen('gameover');
  }, []);

  const handleWorldSelect = useCallback((worldNum, startLevel) => {
    setCurrentLevel(startLevel);
    setIsEndless(false);
    setScreen('game');
  }, []);

  return (
    <div className="app-root">
      {screen === 'home' && (
        <HomeScreen
          onPlay={goPlay}
          onEndless={goEndless}
          onShop={goShop}
          onLeaderboard={goLeaderboard}
          onAchievements={goAchievements}
          onWorldSelect={goWorldSelect}
        />
      )}
      {screen === 'worldselect' && (
        <WorldSelectScreen onSelectWorld={handleWorldSelect} onBack={() => setScreen('home')}/>
      )}
      {screen === 'game' && (
        <GameplayScreen
          key={`${isEndless ? 'endless' : 'campaign'}-${currentLevel}`}
          startLevel={currentLevel}
          isEndless={isEndless}
          onGameOver={handleGameOver}
          onLevelComplete={(nextLevel) => setCurrentLevel(nextLevel)}
          onHome={goHome}
        />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          level={gameOverData.level}
          seeds={gameOverData.seeds}
          combo={gameOverData.combo || 0}
          worldStart={gameOverData.worldStart || 1}
          isEndless={gameOverData.isEndless || false}
          onPlayAgain={() => {
            if (gameOverData.isEndless) {
              setCurrentLevel(1); setIsEndless(true);
            } else {
              const ws = gameOverData.worldStart || 1;
              setCurrentLevel(ws); setIsEndless(false);
            }
            setScreen('game');
          }}
          onShop={goShop}
          onHome={goHome}
        />
      )}
      {screen === 'shop'        && <ShopScreen onBack={() => setScreen('home')}/>}
      {screen === 'leaderboard'   && <LeaderboardScreen onBack={() => setScreen('home')}/>}
      {screen === 'achievements'  && <AchievementsScreen onBack={() => setScreen('home')}/>}
    </div>
  );
}
