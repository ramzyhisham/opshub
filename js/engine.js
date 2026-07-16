// OpsHub Automatic Task & Reminder Engine

export class OpsHubEngine {
  constructor(store) {
    this.store = store;
  }

  // Run the engine to synchronize tasks and generate notifications
  run() {
    const assets = this.store.getAssets();
    const tasks = this.store.getTasks();
    const notifications = this.store.getNotifications();
    const todayStr = "2026-07-16"; // Mocking current system date for consistent operations
    const today = new Date(todayStr);

    let tasksUpdated = false;
    let notificationsUpdated = false;

    assets.forEach(asset => {
      // 1. Skip assets without a renewal/expiry date or one-time items
      if (!asset.renewalDate || asset.renewalType === "One Time") {
        return;
      }

      const renewalDate = new Date(asset.renewalDate);
      const diffTime = renewalDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Update asset status based on actual time remaining
      let newStatus = asset.status;
      if (asset.status !== "Cancelled") {
        if (diffDays < 0) {
          newStatus = "Expired";
        } else if (diffDays <= 7) {
          newStatus = "Renew Soon";
        } else {
          newStatus = "Active";
        }
        if (newStatus !== asset.status) {
          asset.status = newStatus;
          this.store.updateAsset(asset);
        }
      }

      // 2. AUTO-GENERATED TASKS LOGIC
      // Check if a task already exists for this asset and this cycle's renewalDate
      const existingTaskIndex = tasks.findIndex(t => t.assetId === asset.id && t.dueDate === asset.renewalDate);

      if (existingTaskIndex === -1) {
        // No task exists for the current renewal date.
        // First, check if there are previous pending renewal tasks for this asset.
        // If there are, it means the user has updated the renewal date, so the old tasks should be marked Completed.
        tasks.forEach(t => {
          if (t.assetId === asset.id && t.status === "Pending" && t.dueDate !== asset.renewalDate) {
            t.status = "Completed";
            t.completedDate = todayStr;
            t.notes = t.notes ? t.notes + "\nAuto-completed: renewal date updated." : "Auto-completed: renewal date updated.";
            tasksUpdated = true;
          }
        });

        // Now, generate the task for the new renewal date
        const priority = diffDays <= 7 ? "High" : (diffDays <= 30 ? "Medium" : "Low");
        tasks.push({
          id: "task-" + Date.now() + Math.random().toString(36).substr(2, 5),
          assetId: asset.id,
          assetName: asset.name,
          company: asset.company,
          title: `Renew ${asset.name}`,
          priority: priority,
          assignedTo: asset.owner || "Unassigned",
          dueDate: asset.renewalDate,
          status: "Pending",
          completedDate: null,
          notes: `Automatically generated renewal task for ${asset.name}.`
        });
        tasksUpdated = true;
      } else {
        // Task exists. Check if priority should escalate based on time approaching.
        const task = tasks[existingTaskIndex];
        if (task.status === "Pending") {
          const targetPriority = diffDays <= 7 ? "High" : (diffDays <= 30 ? "Medium" : "Low");
          if (task.priority !== targetPriority) {
            task.priority = targetPriority;
            tasksUpdated = true;
          }
        }
      }

      // 3. REMINDER NOTIFICATIONS LOGIC
      // reminderSettings contains offsets (e.g. 30 means 30 days before, 0 means on expiry, -1 means 1 day after)
      const settings = asset.reminderSettings || [30, 15, 7, 3, 1, 0, -1];
      settings.forEach(offsetDays => {
        // If diffDays is exactly equal to the offset, trigger a notification.
        // E.g., if offset is 7, and diffDays is 7 (expiring in 7 days).
        if (diffDays === offsetDays) {
          const notificationKey = `notif-${asset.id}-${offsetDays}-${asset.renewalDate}`;
          const alreadyNotified = notifications.some(n => n.key === notificationKey);

          if (!alreadyNotified) {
            let message = "";
            let type = "info"; // info, warning, danger, success

            if (offsetDays === 0) {
              message = `Renew Today: ${asset.name} (${asset.company}) is due for renewal today!`;
              type = "danger";
            } else if (offsetDays === 1) {
              message = `Renew Tomorrow: ${asset.name} (${asset.company}) is due for renewal tomorrow!`;
              type = "warning";
            } else if (offsetDays === -1) {
              message = `Expired Yesterday: ${asset.name} (${asset.company}) expired yesterday!`;
              type = "danger";
            } else if (offsetDays < -1) {
              message = `Overdue: ${asset.name} (${asset.company}) is ${Math.abs(offsetDays)} days overdue!`;
              type = "danger";
            } else {
              message = `Expiring in ${offsetDays} Days: ${asset.name} (${asset.company}) renewal is due on ${asset.renewalDate}.`;
              type = offsetDays <= 7 ? "warning" : "info";
            }

            notifications.unshift({
              id: "notif-" + Date.now() + Math.random().toString(36).substr(2, 5),
              key: notificationKey,
              assetId: asset.id,
              assetName: asset.name,
              company: asset.company,
              message: message,
              type: type,
              date: todayStr,
              isRead: false
            });
            notificationsUpdated = true;
          }
        }
      });
    });

    if (tasksUpdated) {
      this.store.saveTasks(tasks);
    }
    if (notificationsUpdated) {
      this.store.saveNotifications(notifications);
    }
  }

  // Force execute a renewal: updates payment history, logs activity, and sets next renewal date
  renewAsset(assetId, renewalCost, paymentMethod, invoiceNumber, notes = "") {
    const assets = this.store.getAssets();
    const index = assets.findIndex(a => a.id === assetId);
    if (index === -1) return false;

    const asset = assets[index];
    const todayStr = "2026-07-16";
    const currentRenewalDate = asset.renewalDate;

    // Calculate next renewal date based on renewalType
    if (!currentRenewalDate) return false;
    const dateObj = new Date(currentRenewalDate);
    
    if (asset.renewalType === "Monthly") {
      dateObj.setMonth(dateObj.getMonth() + 1);
    } else if (asset.renewalType === "Quarterly") {
      dateObj.setMonth(dateObj.getMonth() + 3);
    } else if (asset.renewalType === "Yearly") {
      dateObj.setFullYear(dateObj.getFullYear() + 1);
    } else {
      // One time, do nothing
      return false;
    }

    const nextRenewalDateStr = dateObj.toISOString().split("T")[0];

    // Log in payment history
    asset.paymentHistory = asset.paymentHistory || [];
    asset.paymentHistory.unshift({
      id: "ph-" + Date.now(),
      date: todayStr,
      cost: parseFloat(renewalCost) || asset.cost,
      currency: asset.currency,
      invoiceNumber: invoiceNumber || "INV-" + Date.now().toString().substr(-6),
      paymentMethod: paymentMethod || asset.paymentMethod,
      notes: notes || "Asset renewed via OpsHub engine"
    });

    // Log in renewal history
    asset.renewalHistory = asset.renewalHistory || [];
    asset.renewalHistory.unshift({
      id: "rh-" + Date.now(),
      date: todayStr,
      cost: parseFloat(renewalCost) || asset.cost,
      renewalDate: nextRenewalDateStr,
      updatedBy: "OpsHub Engine"
    });

    // Update asset details
    asset.purchaseDate = currentRenewalDate;
    asset.renewalDate = nextRenewalDateStr;
    asset.expiryDate = nextRenewalDateStr;
    asset.status = "Active"; // Set to active as it's renewed!
    asset.activityLog = asset.activityLog || [];
    asset.activityLog.push({
      id: "al-" + Date.now(),
      date: todayStr + " 12:00",
      user: "Current User",
      action: "Renewed Asset",
      details: `Renewed asset. Next renewal date set to ${nextRenewalDateStr}. Cost: ${asset.currency} ${renewalCost}`
    });

    this.store.updateAsset(asset);
    
    // Rerun engine immediately to close old task and schedule new one
    this.run();
    return true;
  }
}
