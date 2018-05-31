# This file is used by Rack-based servers to start the application.
ENV['GEM_PATH'] = '/var/lib/gems/2.3.0/'
require ::File.expand_path('../config/environment',  __FILE__)
run RedmineApp::Application
