// js/auth-ui.js
import { loginWithGoogle, loginWithEmail, logout, onAuthChange, isAdmin } from './auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';
import { db } from './firebase.js';

/**
 * Muestra un Toast de Bootstrap.
 */
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-bg-${type} border-0 mb-2`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button
        type="button"
        class="btn-close btn-close-white me-2 m-auto"
        data-bs-dismiss="toast"
        aria-label="Cerrar"
      ></button>
    </div>`;
  container.append(toastEl);

  const bsToast = new bootstrap.Toast(toastEl, {
    animation: true,
    autohide: true,
    delay: duration
  });
  bsToast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/**
 * Si estamos en auth.html (móvil), redirige a index.html tras un pequeño delay.
 */
function maybeRedirectHome() {
  if (window.location.pathname.endsWith('auth.html')) {
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500); // deja 0.5s para que se vea el toast
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // — Elementos (pueden ser null en auth.html vs index.html)
  const btnOpenAuth  = document.getElementById('btn-open-auth');
  const btnLogout    = document.getElementById('btn-logout');
  const authModalEl  = document.getElementById('authModal');
  const authModal    = authModalEl ? new bootstrap.Modal(authModalEl) : null;
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const btnGoogleLg  = document.getElementById('btn-google-login');
  const btnGoogleReg = document.getElementById('btn-google-register');

  // — Abrir modal o redirigir en móvil
  if (btnOpenAuth) {
    btnOpenAuth.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        window.location.href = 'auth.html';
      } else if (authModal) {
        authModal.show();
      }
    });
  }

  // — Cerrar sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await logout();
        showToast('Sesión cerrada con éxito', 'info');
      } catch (err) {
        showToast(`Error cerrando sesión: ${err.message}`, 'danger');
      }
    });
  }

  // — Login con email/password
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      try {
        const user = await loginWithEmail(
          loginForm.loginEmail.value,
          loginForm.loginPassword.value,
          false
        );
        showToast(`¡Ingreso exitoso! Bienvenido ${user.displayName||user.email}`, 'success');
        if (authModal) {
          authModal.hide();
          document.body.classList.remove('modal-open');
          document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        }
        maybeRedirectHome();
      } catch (err) {
        showToast(`Error al ingresar: ${err.message}`, 'danger');
      }
    });
  }

  // — Registro con email/password
  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = registerForm.regName.value.trim();
      const p1   = registerForm.regPassword.value;
      const p2   = registerForm.regPassword2.value;
      if (p1 !== p2) {
        return showToast('Las contraseñas no coinciden', 'warning');
      }
      try {
        const user = await loginWithEmail(
          registerForm.regEmail.value,
          p1,
          true
        );
        // Guardar nombre en Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name,
          createdAt: serverTimestamp()
        }, { merge: true });
        showToast(`¡Registro exitoso! Bienvenido ${name}`, 'success');
        if (authModal) {
          authModal.hide();
          document.body.classList.remove('modal-open');
          document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        }
        maybeRedirectHome();
      } catch (err) {
        showToast(`Error al registrarse: ${err.message}`, 'danger');
      }
    });
  }

  // — Google (login o registro)
  async function googleFlow() {
    try {
      const user = await loginWithGoogle();
      showToast(`¡Ingreso con Google exitoso! Bienvenido ${user.displayName}`, 'success');
      if (authModal) {
        authModal.hide();
        document.body.classList.remove('modal-open');
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      }
      maybeRedirectHome();
    } catch (err) {
      showToast(`Error con Google: ${err.message}`, 'danger');
    }
  }
  if (btnGoogleLg)  btnGoogleLg.addEventListener('click',  googleFlow);
  if (btnGoogleReg) btnGoogleReg.addEventListener('click', googleFlow);

  // — Detectar cambios de autenticación y mostrar Admin
  onAuthChange(async user => {
    const adminLink = document.getElementById('admin-link');
    if (user) {
      btnOpenAuth?.classList.add('d-none');
      btnLogout?.classList.remove('d-none');
      if (await isAdmin(user.uid)) {
        adminLink?.classList.remove('d-none');
      }
    } else {
      btnOpenAuth?.classList.remove('d-none');
      btnLogout?.classList.add('d-none');
      adminLink?.classList.add('d-none');
    }
  });
});
