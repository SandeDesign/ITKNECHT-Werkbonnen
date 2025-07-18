@@ .. @@
       </div>
 
-      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
+      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
         {filteredColleagues.map((colleague) => (
           <motion.div
             key={colleague.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
           >
             <Card>
-              <CardHeader>
+              <CardHeader className="p-4 sm:p-6">
                 <CardTitle className="flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400">
                     {colleague.name.charAt(0).toUpperCase()}
)
)
}