import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';
import WorkOrderForm from '../workorder/WorkOrderForm';

const Overview = () => {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <WorkOrderForm workOrderId={id} />
    </div>
  );
};

export default Overview;