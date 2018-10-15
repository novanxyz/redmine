module MetaHelper

    def meta_description(*args)
        if args.empty?
            if @meta_description
                @meta_description
            else
                Redmine::Info.app_name
            end
        elsif args.first.is_a?(String)
            @meta_description = args.first
        end
    end

    def meta_keywords(*args)
        if args.empty?
            @meta_keywords = %w(issue bug tracker) if @meta_keywords.blank?
            @meta_keywords.select {|k| !k.blank? }.join(',')
        elsif args.first.is_a?(Array)
            @meta_keywords = args.first
        else
            @meta_keywords ||= []
            @meta_keywords += args
        end
    end

    def meta_description?
        if @meta_description
            true
        else
            false
        end
    end

    def meta_keywords?
        if @meta_keywords
            true
        else
            false
        end
    end

    def meta_images(&block)
        @meta_images ||= []
        @meta_images.each do |image|
            yield(image) if block_given?
        end
    end

    def truncate_description(text, length = 255)
        text.gsub!(%r{ {2,}}m, ' ')
        text.strip!
        return format_description(text) if text.length <= length
        if text.match(%r{\A(.{#{(length/2).floor},#{length}})\r?\n}m)
            return format_description($1)
        end
        text = format_description(text)
        return text if text.length <= length
        if text.match(%r{\A(.{#{(length/2).floor},#{length}}\.)})
            return $1
        elsif text.match(%r{\A(.{,#{length-4}}\s)})
            return $1 + '...'
        end
        text[0, length]
    end

    def format_description(text)
        text.gsub(%r{([^!,.:;?\s]) *\r?\n\s*}m, '\1. ').gsub(%r{\s{2,}}m, ' ').strip
    end

    def stop_words
        @@stop_words ||= begin
            words_list = File.join(File.dirname(__FILE__), '../config/stopwords.list')
            if File.exist?(words_list)
                File.readlines(words_list).map(&:chomp)
            else
                []
            end
        end
    end

    def extract_keywords(text)
        strip_entities(text).scan(%r{[^\000-\100\133-\140\173-]{3,30}}i).inject({}) do |hash, word|
            keyword = word.downcase
            if hash.has_key?(keyword)
                hash[keyword] += 1
            else
                hash[keyword] = 1
            end
            hash
        end.sort{ |a, b| b[1] <=> a[1] }.inject([]) do |keywords, item|
            keywords << item[0] unless stop_words.include?(item[0])
            return keywords if keywords.size == 10
            keywords
        end
    end

    def extract_images(html)
        html.scan(%r{<img [^>]*src="(https?://[^"]+)"}i).flatten
    end

    def extract_wiki_title(page)
        if page.text.match(%r{\A\s*h[1-6]\. +(.+?)$})
            $1
        else
            page.pretty_title
        end
    end

    def strip_textile(text, options = {})
        text.gsub!(%r{\{\{[<>]?toc\}\}}i, '')
        html = textilizable(text, options.merge(:only_path => false))
        @meta_images = extract_images(html)
        plain = strip_tags(html)
        plain.gsub(%r{&(nbsp|para);}, ' ')
    end

    def strip_entities(text)
        text.gsub(%r{&#?[a-z0-9]+;}i, '')
    end

    def twitter_username(username)
        username.start_with?('@') ? username : "@#{username}"
    end

    def project_twitter(project)
        settings = Setting.plugin_meta
        if settings[:twitter_project_custom_field]
            custom_value = project.custom_value_for(settings[:twitter_project_custom_field])
            return twitter_username(custom_value.value) if custom_value && custom_value.value.present?
        end
        return twitter_username(settings[:twitter_site]) unless settings[:twitter_site].blank?
        nil
    end

end
