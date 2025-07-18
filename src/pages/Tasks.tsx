import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';
import TodoList from '../components/dashboard/TodoList';

const Tasks = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Mijn Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <TodoList enableAgendaView={false} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Tasks;