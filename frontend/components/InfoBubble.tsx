
export default function InfoBubble({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white bg-opacity-30 dark:bg-gray-800 dark:bg-opacity-70 backdrop-blur-md rounded-lg shadow-md p-6 transition-opacity duration-300 ease-in-out mb-4">
        {children}
        </div>
    )
}