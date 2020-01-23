document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('clear-storage')

    console.log(btn)
    btn.addEventListener('click', () => {
        sessionStorage.clear()
        localStorage.clear()
    })
})