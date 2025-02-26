'use client'

import { useState } from 'react'
import { Language, translate } from '../utils/translations'
import SophisticatedButton from './SophisticatedButton'

interface MyValuesProps {
  language: Language
}

const MyValues: React.FC<MyValuesProps> = ({ language }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const content = {
    ko: [
      translate('valuesDescription', language),
      "이곳에 가치관이나 메시지를 작성하실 수 있습니다. 위에 작성한 비전 및 목표에 대한 내용을 자유롭게 입력하세요.",
      "예시",
      "특히 인공지능은 우리의 일상과 산업 전반에 걸쳐 커다란 변화를 이끌며 미래를 재정의하고 있습니다. 하지만 이러한 변화가 과연 모든 이에게 공평하게 다가가고 있는지, 그 과정을 되돌아볼 필요가 있습니다.",
      "저희는 기술의 장벽을 낮추고, 누구나 인공지능을 통해 더 나은 삶을 누릴 수 있도록 돕는 데 최선을 다하고자 합니다. 교육과 소통을 통해 더 많은 사람들이 기술을 이해하고 활용할 수 있도록 지원하며, 모두가 함께 성장할 수 있는 포용적 환경을 만들어 나가겠습니다.",
      "감사합니다."
    ],
    en: [
      translate('valuesDescription', language),
      "You can write your values or message here. Feel free to enter content about the vision and goals written above.",
      "Example",
      "Particularly, artificial intelligence is leading major changes across our daily lives and industries, redefining our future. However, we need to look back and consider whether these changes are truly reaching everyone equally.",
      "We are committed to lowering technological barriers and doing our best to help everyone enjoy a better life through artificial intelligence. Through education and communication, we will support more people in understanding and utilizing technology, creating an inclusive environment where everyone can grow together.",
      "Thank you."
    ],
    ja: [
      translate('valuesDescription', language),
      "ここに価値観やメッセージを記入できます。上記に記載したビジョンや目標に関する内容を自由に入力してください。",
      "例",
      "特に人工知能は私たちの日常生活と産業全般にわたって大きな変化をもたらし、未来を再定義しています。しかし、これらの変化が本当にすべての人に平等に届いているのか、そのプロセスを振り返る必要があります。",
      "私たちは技術の障壁を低くし、誰もが人工知能を通じてより良い生活を送れるよう支援することに最善を尽くします。教育とコミュニケーションを通じて、より多くの人々が技術を理解し活用できるよう支援し、皆が共に成長できる包括的な環境を作り上げていきます。",
      "ありがとうございます。"
    ],
    zh: [
      translate('valuesDescription', language),
      "您可以在此填写您的价值观或信息。请自由输入上述愿景和目标相关的内容。",
      "示例",
      "特别是人工智能正在引领我们的日常生活和产业全领域的重大变革，重新定义我们的未来。然而，我们需要反思这些变化是否真正平等地惠及每个人。",
      "我们致力于降低技术壁垒，尽最大努力帮助每个人通过人工智能获得更好的生活。通过教育和沟通，我们将支持更多人理解和利用技术，创造一个包容的环境，让每个人都能共同成长。",
      "谢谢。"
    ]
  }

  const currentContent = content[language] ?? content['ko'] ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="w-full">
        <div className="mb-6 relative px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 flex flex-col items-center">
          <svg className="absolute top-0 left-0 w-5 sm:w-7 md:w-12 h-5 sm:h-7 md:h-12 text-gray-300 dark:text-gray-700 transform -translate-x-1/6 -translate-y-1/6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
          </svg>
          <h2 className="text-lg sm:text-2xl md:text-3xl relative z-10 text-center mb-4 sm:mb-5 md:mb-6">
            {translate('valuesDescription', language).split('\n').map((line: string, i: number) => (
              <span key={i} className="block text-lg sm:text-xl md:text-4xl font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 whitespace-nowrap">
                {line}
              </span>
            ))}
          </h2>
          <svg className="absolute bottom-0 right-0 w-5 sm:w-7 md:w-12 h-5 sm:h-7 md:h-12 text-gray-300 dark:text-gray-700 transform translate-x-1/6 translate-y-1/6 rotate-180" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
          </svg>
        </div>
        <div className="space-y-4">
          {(isExpanded ? currentContent.slice(1) : currentContent.slice(1, 3)).map((paragraph, index) => (
            <p key={index} className="text-gray-600 dark:text-gray-300">{paragraph}</p>
          ))}
        </div>
        <div className="flex justify-center mt-6">
          <SophisticatedButton 
            expanded={isExpanded} 
            onClick={() => setIsExpanded(!isExpanded)} 
            language={language}
          />
        </div>
      </div>
    </div>
  )
}

export default MyValues