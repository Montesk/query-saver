document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('clear-storage')

    btn.addEventListener('click', () => {
        sessionStorage.clear()
        localStorage.clear()
    })
})