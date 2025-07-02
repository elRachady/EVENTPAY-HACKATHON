document.addEventListener('DOMContentLoaded', async () => {
    // 1. Vérifier l'authentification
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        window.location.href = '/login.html';
        return;
    }

    // 2. Charger les données utilisateur
    await loadUserProfile();
    
    // 3. Charger les catégories
    await loadCategories();
    
    // 4. Charger les événements
    await loadFeaturedEvents();
});

async function loadUserProfile() {
    try {
        const response = await fetch(`/api/users/${localStorage.getItem('user_id')}`);
        if (!response.ok) throw new Error('Erreur de chargement');
        
        const user = await response.json();
        document.getElementById('user-header').innerHTML = `
            <span class="font-medium">${user.name}</span>
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                ${user.name.charAt(0).toUpperCase()}
            </div>
        `;
    } catch (error) {
        console.error(error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/api/tickets/categories');
        const categories = await response.json();
        
        const container = document.getElementById('categories');
        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'px-4 py-2 bg-white rounded-lg border border-gray-200 whitespace-nowrap flex items-center';
            btn.innerHTML = `
                <i class="fas ${category.icon} mr-2" style="color:${category.color}"></i>
                ${category.name}
            `;
            btn.onclick = () => window.location.href = `/events.html?category=${encodeURIComponent(category.name)}`;
            container.appendChild(btn);
        });
    } catch (error) {
        console.error(error);
    }
}

async function loadFeaturedEvents() {
    try {
        const response = await fetch('/api/tickets/events?featured=true&limit=4');
        const events = await response.json();
        
        const container = document.getElementById('events-container');
        events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow';
            eventCard.innerHTML = `
                <img src="${event.image_url}" alt="${event.name}" class="w-full h-40 object-cover">
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg">${event.name}</h3>
                        <span class="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">${event.price_sats} SATS</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-3">
                        <i class="fas fa-map-marker-alt mr-1"></i>${event.location}
                    </p>
                    <button onclick="navigateToEvent(${event.id})" 
                            class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition">
                        Voir détails
                    </button>
                </div>
            `;
            container.appendChild(eventCard);
        });
    } catch (error) {
        console.error(error);
    }
}

// Fonctions globales
function navigateToEvent(eventId) {
    window.location.href = `/event-details.html?id=${eventId}`;
}