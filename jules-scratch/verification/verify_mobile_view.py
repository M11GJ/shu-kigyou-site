from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # iPhone 11 Proのデバイスエミュレーションを使用
        context = browser.new_context(**p.devices['iPhone 11 Pro'])
        page = context.new_page()

        # ローカルのHTMLファイルへのパスを指定
        import os
        filepath = os.path.abspath('index.html')
        page.goto(f'file://{filepath}')

        # スクリーンショットを撮影
        page.screenshot(path='jules-scratch/verification/verification.png')

        browser.close()

if __name__ == '__main__':
    run()
