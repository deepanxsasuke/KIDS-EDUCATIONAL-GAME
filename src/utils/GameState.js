export default class GameState {
    static getScore(gameId) {
        return parseInt(localStorage.getItem(`smartkid_${gameId}_score`) || '0', 10);
    }

    static setScore(gameId, score) {
        localStorage.setItem(`smartkid_${gameId}_score`, score.toString());
    }

    static isMusicEnabled() {
        return localStorage.getItem('smartkid_music') !== 'false';
    }

    static toggleMusic() {
        const current = this.isMusicEnabled();
        localStorage.setItem('smartkid_music', (!current).toString());
        return !current;
    }

    static getLevel(gameId) {
        // Levels are 1 to 10
        let level = parseInt(localStorage.getItem(`smartkid_${gameId}_level`) || '1', 10);
        return Math.min(Math.max(level, 1), 10);
    }

    static setLevel(gameId, level) {
        level = Math.min(Math.max(level, 1), 10);
        localStorage.setItem(`smartkid_${gameId}_level`, level.toString());
    }

    static getWordIndex(gameId) {
        return parseInt(localStorage.getItem(`smartkid_${gameId}_word_index`) || '0', 10);
    }

    static setWordIndex(gameId, index) {
        localStorage.setItem(`smartkid_${gameId}_word_index`, index.toString());
    }

    static addScoreAndCheckLevelUp(gameId, pointsAdded) {
        let currentScore = this.getScore(gameId);
        let currentLevel = this.getLevel(gameId);

        const newScore = currentScore + pointsAdded;
        this.setScore(gameId, newScore);

        // Check if we hit the next 100-point threshold
        // Level 1 -> 2: 100 points
        // Level 2 -> 3: 200 points
        const requiredScore = currentLevel * 100;

        if (newScore >= requiredScore && currentLevel < 10) {
            const nextLevel = currentLevel + 1;
            this.setLevel(gameId, nextLevel);
            return { leveledUp: true, gameCompleted: false, newLevel: nextLevel, newScore };
        }

        // Check if game is completed (Level 10 finished)
        if (currentLevel === 10 && newScore >= requiredScore) {
            return { leveledUp: false, gameCompleted: true, newLevel: currentLevel, newScore };
        }

        return { leveledUp: false, gameCompleted: false, newLevel: currentLevel, newScore };
    }
}
