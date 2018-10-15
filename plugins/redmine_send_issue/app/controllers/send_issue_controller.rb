class SendIssueController < ApplicationController
  unloadable

  def index
    @issue = Issue.find(params[:issue_id])
    Mailer.issue_add(@issue,params[:mail_to],'support@vardion.com').deliver
    j = Journal.new(:journalized => @issue,:user => User.current ,:notes => "Issue Card sent to " + params[:mail_to])
    j.save
    redirect_to '/issues/' + params[:issue_id]
  end

  def send_issue(issue,mail_to)
    
  end
end

