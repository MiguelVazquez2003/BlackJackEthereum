export const Footer = () => {
        return(
                <footer className="w-full max-w-6xl mt-12 border-t border-white/10 pt-8 pb-4 text-center">
                        <p className="text-sm text-gray-400">© {new Date().getFullYear()} Blackjack Ethereum. Todos los derechos reservados.</p>
                        <p className="text-xs text-gray-500 mt-2">Juega de manera responsable. El juego con criptomonedas involucra riesgos financieros.</p>
                </footer>
        )
}