require 'json'
class SlackController < ApplicationController
  unloadable


  def listen
	  
      return remnder json: {'text' => '_your redmine slack plugins not configured yet_' } unless params['token'] == Setting.plugin_redmine_slack[:slack_out_token] or params['token'] ==  Setting.plugin_redmine_slack[:slack_slash_token]

      username   = params['user_name']
      project_ch = params['channel_name']
      task_text  = params['text']

      command = params['command']
      task  = task_text.split(' ', 4)
      if command then
	task_id   = task[0]
        task_stat = task[1]
      else
          task_id   = task[1]
          task_stat = task[2]
      end
      if task_stat then
#         logger.info task_stat
	 issue_stat = IssueStatus.find_by_name(task_stat.capitalize)
#	 logger.info issue_stat.id
      end


      issue = Issue.find_by_id(task_id)
      return unless issue 

#      logger.info issue.status
#      logger.info issue.assigned_to
#      logger.info issue.to_s

      @guessed_host_and_path = 'http://%s' % request.host_with_port.dup
      @guessed_host_and_path << ('/'+ Redmine::Utils.relative_url_root.gsub(%r{^\/}, '')) unless Redmine::Utils.relative_url_root.blank?
#      logger.info @guessed_host_and_path	     	     	
      return render json: {'text' => '['+issue.project.to_s + '] *' + issue.subject + '*', 
			'attachments' => [
				{'fallback' => 'Required plain-text summary of the attachment.',
				 'title'=>  issue.subject, 
				 'text' => issue.description,
				 'title_link' =>  @guessed_host_and_path + '/issues/' + issue.id.to_s,
				 'fields' =>  [ {'title'=>'Status','value'=> issue.status.to_s,'short'=>true },
						{'title'=>'Assignee','value'=> issue.assigned_to.to_s, 'short' => true }] 
			}]
			} 

      if @issue then       
         respond_to do |format|
            format.js{ render json: @issue }  
         end
      end
     
  end

  def verify_authenticity_token
      return true
  end
end
