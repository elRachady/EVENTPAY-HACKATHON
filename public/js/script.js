  document.getElementById('loginForm').onsubmit = async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // État de chargement
    submitBtn.disabled = true;
    btnText.textContent = "Connexion en cours...";
    spinner.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
                
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Échec de la connexion");
      }
      
    // Succès
    showNotification({
    type: 'success',
    title: 'Connexion réussie',
    message: 'Redirection en cours...',
    duration: 1500
    });

    // Stockage de l'id utilisateur et redirection
    localStorage.setItem('user_id', data.user.id);
    setTimeout(() => {
    window.location.href = 'home.html';
    }, 1500);
      
    } catch (error) {
      // Gestion des erreurs spécifiques
      let errorMessage = "Erreur inconnue";
      if (error.message.includes("401")) {
        errorMessage = "Email ou mot de passe incorrect";
      } else if (error.message.includes("network")) {
        errorMessage = "Problème de connexion au serveur";
      } else {
        errorMessage = error.message;
      }
      
      showNotification({
        type: 'error',
        title: 'Erreur de connexion',
        message: errorMessage,
        duration: 4000
      });
      
      // Animation d'erreur
      document.getElementById('loginForm').classList.add('animate__animated', 'animate__headShake');
      setTimeout(() => {
        document.getElementById('loginForm').classList.remove('animate__animated', 'animate__headShake');
      }, 1000);
      
    } finally {
      // Réinitialisation UI
      submitBtn.disabled = false;
      btnText.textContent = "Se connecter";
      spinner.classList.add('hidden');
    }
  };
  
  // Fonction de notification (identique à précédemment)
  function showNotification({ type, title, message, duration = 5000 }) {
    const container = document.getElementById('notificationContainer');
    const notificationId = Date.now().toString();
    
    const notification = document.createElement('div');
    notification.id = `notification-${notificationId}`;
    notification.className = `mb-4 p-4 rounded-lg shadow-lg border-l-4 ${
      type === 'success' 
        ? 'bg-green-50 border-green-500' 
        : 'bg-red-50 border-red-500'
    } notification-slide-in`;
    
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 pt-0.5">
          ${type === 'success' 
            ? '<svg class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
            : '<svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'
          }
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium ${
            type === 'success' ? 'text-green-800' : 'text-red-800'
          }">${title}</h3>
          <p class="text-sm ${
            type === 'success' ? 'text-green-700' : 'text-red-700'
          }">${message}</p>
        </div>
        <button onclick="closeNotification('${notificationId}')" class="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-full inline-flex items-center justify-center h-8 w-8 ${
          type === 'success' ? 'text-green-500 hover:bg-green-100' : 'text-red-500 hover:bg-red-100'
        }">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `;
    
    container.appendChild(notification);
    
    const autoCloseTimer = setTimeout(() => {
      closeNotification(notificationId);
    }, duration);
    
    notification.dataset.timer = autoCloseTimer;
  }
  
  window.closeNotification = function(id) {
    const notification = document.getElementById(`notification-${id}`);
    if (notification) {
      clearTimeout(notification.dataset.timer);
      notification.classList.add('notification-slide-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  };
  