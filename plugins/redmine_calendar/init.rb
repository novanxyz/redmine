require 'redmine'
require 'json'
require 'dispatcher' unless Rails::VERSION::MAJOR >= 3


Redmine::Plugin.register :redmine_calendar do
  name 'Redmine Calendar plugin'
  author 'Novan Firmansyah'
  description 'This is a plugin for Redmine'
  version '1.1.0'
  url 'http://redmine.vardion.com/'
  author_url 'http://novanxyz.com/about'

  require_dependency 'redmine_calendar/issue_listener'  
  settings \
		:default => {
			'client_id' => '405217832311-ocsv3h22oqpqv9ul1rglmfck79gkvobm.apps.googleusercontent.com',
			'client_secret' => 'Vr1azyLRAFJsk__MtMIyUCbQ',
			'calendar_id' => 'ia5vv944n9hc7fqg7kq04t0j0s@group.calendar.google.com',
			'calendar_task_id' => 'ia5vv944n9hc7fqg7kq04t0j0s@group.calendar.google.com',
			'calendar_tasks_id' => 'ia5vv944n9hc7fqg7kq04t0j0s@group.calendar.google.com' ,
			'refresh_token' => '1/Wmxgk0gdJh2agpFPrrHygVMOZCPubhSeeOC7wKhiiPY',
			'trackers' => [6],
			'status' => [1]
		},
		:partial => 'settings/redmine_gc_settings'  

#  project_module :issue_tracking do |map|
#  	map.permission :view_delivery_date, {}
#  	map.permission :edit_delivery_date, {}
#  end

#  permission :view_livrable_project, :livrable_project => :index

#  settings :default => {}, :partial => 'settings/yassine_settings'

#  project_module :module_livrable_project do
#  	permission :view_livrable_project, :livrable_project => :index
#  end

#  if_proc = Proc.new{|project| project.enabled_module_names.include?('module_livrable_project')}




end

