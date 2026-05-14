import { motion } from "framer-motion";

export default function PostCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-700 leading-relaxed line-clamp-2">{content}</p>
    </motion.article>
  );
}
