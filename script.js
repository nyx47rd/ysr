document.addEventListener('DOMContentLoaded', () => {
    let allGames = [];
    const gameContainer = document.getElementById('game-container');

    function displayGames(gamesToShow) {
        gameContainer.innerHTML = '';
        gamesToShow.forEach(game => {
            const gameLink = document.createElement('a');
            gameLink.href = game.path;
            gameLink.classList.add('game');

            const gameTitle = document.createElement('h2');
            gameTitle.textContent = game.name;
            gameLink.appendChild(gameTitle);
            gameContainer.appendChild(gameLink);
        });
    }

    fetch('games.json')
        .then(response => response.json())
        .then(games => {
            allGames = games;
            displayGames(allGames);
        })
        .catch(error => console.error('Oyunlar yüklenirken hata oluştu:', error));

    window.searchGames = () => {
        const searchTerm = document.getElementById('search-box').value.toLowerCase();
        const filteredGames = allGames.filter(game => game.name.toLowerCase().includes(searchTerm));
        displayGames(filteredGames);
    };
});
