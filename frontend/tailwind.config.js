module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // Vite's default src structure
    ],
    theme: {
        extend: {
            colors: {
                primary: '#7f5af0', // Replace with your CSS vars if needed
                background: '#1f1f28',
            },
            animation: {
                'bg-pulse': 'backgroundAnimation 10s infinite alternate'
            }
        },
    },
    plugins: [],
}