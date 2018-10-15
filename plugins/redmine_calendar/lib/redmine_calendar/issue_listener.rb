class IssueCalendarListener < Redmine::Hook::Listener
  unloadable
  
  def controller_issues_after_delete(context={})
	if calendar_ready 
		if self.event_id != nil
			begin
				cal = get_acces_to_google_calendar
				event_to_delete = cal.find_event_by_id(self.event_id)
				cal.delete_event(event_to_delete[0])
			rescue
			end

		end
	end

  end


  def controller_issues_new_after_save(context={})	
	
	return unless Setting.plugin_redmine_calendar['client_id']
	return unless Setting.plugin_redmine_calendar['client_secret']
	return unless Setting.plugin_redmine_calendar['calendar_tasks_id']
	return unless Setting.plugin_redmine_calendar['refresh_token']

	issue = context[:issue]	

	project = Project.find_by_id(issue.project_id)

	parent_name = " [" + project.name + " ]"

	p = project
	while p.parent != nil do 
	  parent_name += " [" + p.parent.name  + " ]"
	  p = p.parent
	end
	
	
	return unless issue.start_date 		
	return unless Setting.plugin_redmine_calendar['trackers'].include?(issue.tracker_id.to_s)
	return unless Setting.plugin_redmine_calendar['status'].include?(issue.status_id.to_s)
	
	title = ''
	issue_path = Setting.host_name + "issues/" + issue.id.to_s	
	title += parent_name.to_s + '  #' +  issue.id.to_s + " " + issue.subject  
	description = issue.description
	description += "\n\n#{issue_path}"
	description = description.to_json
	description.gsub!(/\A"|"\Z/, '')

	
	
	attendee = get_attendee(issue)
	
	event = nil
	start_date =  issue.start_date.to_s
	due_date = issue.due_date
    	due_date = due_date.to_s
    
    
	menit =  (issue.estimated_hours * 60).to_i
	h,m = menit.divmod(60)
	meet_time = "%s %02d:%02d" % [issue.start_date.to_s,h,m]

	start_date =  Time.parse(meet_time)
	if issue.due_date == nil
		due_date = start_date + 60*60
	end 		
	begin
		cal = get_access_to_google_calendar
		#Rails.logger.error cal.login_with_refresh_token(Setting.plugin_redmine_calendar['refresh_token'].to_s)
		
		#if self.event_id == nil
		event = cal.create_event do |e|
			 e.title = title 
			 e.start_time = start_date
			 e.end_time = due_date
			 e.description = description
			 e.attendees = attendee
			 e.visibility = issue.is_private ? 'private'  : 'public'
		end
		#else
		#  event = cal.find_or_create_event_by_id(self.event_id) do |e|
		#    e.title = title 
		#    e.start_time = Time.parse(issue.start_date.to_s) 
		#    e.end_time = Time.parse(issue.due_date.to_s) 
		#    e.description = issue_path 
		#    e.attendees = attendee
		#   e.visibility = 'private'
	rescue Exception => e
		#Rails.logger.error "err: #{event}"
		#Rails.logger.error "exp: #{e.inspect}"
		Rails.logger.error e.message
		#Rails.logger.error e.backtrace.join("\n\t")
	end 
	#  end
	#end
	#Rails.logger.error event
	#issue.event_id = event.id

  end
  
  
private
  def get_attendee(issue)
	attendee = []
	is_group = false
	users = nil
	gg = nil
	
	#return attendee unless issue.assigned_to_id 
		
	begin
		att = [issue.assigned_to_id,issue.author_id]
		users = User.find( att )
		attendee = attendee | users.collect {|u| {'email' => u.mail, 'displayName' => u.firstname , 'responseStatus' => 'accepted'} } 
	rescue
		gg = Group.find(issue.assigned_to_id)
		is_group = true
	end
	
	watcher_user_ids = issue.watcher_user_ids
	watcher_user_ids.delete(issue.assigned_to_id)	
	watcher_user_ids.delete(issue.author_id)	
	return attendee unless watcher_user_ids
	
	users = User.find(watcher_user_ids)	
	attendee = attendee | users.collect {|u| {'email' => u.mail, 'displayName' => u.firstname , 'responseStatus' => 'tentative'} } 
	invites = issue.custom_field_value(5).split(',')
	attendee = attendee | invites.collect{|e| {'email' => e, 'displayName' => e.split('@',1)[0] , 'responseStatus' => 'tentative'} }
	attendee.compact
	Rails.logger.error attendee
	attendee.reject!{|a| a.to_s.empty?}
	Rails.logger.error attendee
	return attendee
  end

  def get_access_to_google_calendar
	cal = Google::Calendar.new(:client_id => Setting.plugin_redmine_calendar['client_id'].to_s, 
					:client_secret => Setting.plugin_redmine_calendar['client_secret'].to_s, 
					:calendar => Setting.plugin_redmine_calendar['calendar_tasks_id'].to_s, 
					:redirect_url => "urn:ietf:wg:oauth:2.0:oob",  # this is what Google uses for 'applications'
					:refresh_token => Setting.plugin_redmine_calendar['refresh_token'].to_s
				   )
	return cal
  end
  
end
