class CreateIssueEvents < ActiveRecord::Migration
  def self.up
    add_column :issues, :event_id, :string
    alter_column :issues, :start_date, :datetime
    alter_column :issues, :due_date, :datetime
  end
  def self.change
    alter_column :issues, :start_date, :datetime
    alter_column :issues, :due_date, :datetime
  end

  def self.down
    alter_column :issues, :start_date, :date
    alter_column :issues, :due_date, :date
  	remove_column :issues, :event_id, :string
  end
end
