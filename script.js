document.addEventListener('DOMContentLoaded', () => {
    fetch('games.json')
        .then(response => response.json())
        .then(games => {
            const gameContainer = document.getElementById('game-container');
            games.forEach(game => {
                const gameLink = document.createElement('a');
                gameLink.href = game.path;
                gameLink.classList.add('game');

                const gameImage = document.createElement('img');
                gameImage.src = game.image;
                gameImage.alt = game.name;

                const gameTitle = document.createElement('h2');
                gameTitle.textContent = game.name;

                gameLink.appendChild(gameImage);
                gameLink.appendChild(gameTitle);
                gameContainer.appendChild(gameLink);
            });
        })
        .catch(error => console.error('Oyunlar yüklenirken hata oluştu:', error));
});