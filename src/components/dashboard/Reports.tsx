import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { motion } from 'framer-motion';
import { Download, Calendar, Filter, ChevronDown } from 'lucide-react';

const Reports = () => {
  const reports = [
    {
      id: 1,
      title: 'Monthly Performance',
      description: 'Complete analytics overview',
      date: 'October 2025',
      size: '2.4 MB',
      type: 'PDF'
    },
    {
      id: 2,
      title: 'User Engagement',
      description: 'User behavior and interaction metrics',
      date: 'September 2025',
      size: '1.8 MB',
      type: 'CSV'
    },
    {
      id: 3,
      title: 'Conversion Analysis',
      description: 'Detailed conversion statistics',
      date: 'August 2025',
      size: '3.2 MB',
      type: 'PDF'
    },
    {
      id: 4,
      title: 'Revenue Report',
      description: 'Financial performance summary',
      date: 'July 2025',
      size: '1.5 MB',
      type: 'Excel'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Download and analyze your data</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" icon={<Calendar className="h-4 w-4" />}>
            Date Range
          </Button>
          <Button variant="outline" icon={<Filter className="h-4 w-4" />}>
            Filter
          </Button>
          <Button icon={<Download className="h-4 w-4" />}>
            Generate Report
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Available Reports</h3>
          <div className="mt-3 sm:mt-0 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span>Sort by: Most Recent</span>
            <ChevronDown className="ml-1 h-4 w-4" />
          </div>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2"
        >
          {reports.map((report) => (
            <motion.div key={report.id} variants={item}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                    <div className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {report.type}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>{report.date}</div>
                      <div>{report.size}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={<Download className="h-4 w-4" />}
                    >
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Custom Report</CardTitle>
            <CardDescription>Create a tailored report based on your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Report Type
                  </label>
                  <select className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option>Analytics Overview</option>
                    <option>User Activity</option>
                    <option>Financial Summary</option>
                    <option>Performance Metrics</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Range
                  </label>
                  <select className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Custom range</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Format
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input type="radio" name="format" className="h-4 w-4 text-primary-600" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">PDF</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="format" className="h-4 w-4 text-primary-600" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Excel</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="format" className="h-4 w-4 text-primary-600" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">CSV</span>
                  </label>
                </div>
              </div>
              
              <div className="pt-2">
                <Button type="submit" icon={<Download className="h-4 w-4" />}>
                  Generate Custom Report
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Reports;