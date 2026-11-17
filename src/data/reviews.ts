export type Review = {
  name: string;
  text: string;
  source: "google" | "facebook";
  avatar?: string;
};

export const reviews: Record<string, Review> = {
  "Nichola Hindle-Marsh": {
    "name": "Nichola Hindle-Marsh",
    "text": "Just purchased our first home in Spain with help from Alex and his wife! They have helped a lot guiding us through an unfamiliar process and putting us in touch with reputable builders as the property we’re buying needs work doing to it. Can’t wait to get out there now to furnish it and enjoy some sunshine. Thank you so much",
    "source": "google",
    "avatar": "nichola-hindle-marsh.svg"
  },
  "Eugen Hanley": {
    "name": "Eugen Hanley",
    "text": "“Completed this week on our new apartment. Couldn't have done it without the help of Solmar Homes. Alex and Sam provided us with outstanding service and help, which didn't end when the contracts were signed. Highly recommended!”",
    "source": "facebook",
    "avatar": "eugen-hanley.avif"
  },
  "Hellen Hazel": {
    "name": "Hellen Hazel",
    "text": "“We completed on our first holiday home in October with the help from Alex. Definitely couldn’t have done it without his help & guidance.”",
    "source": "facebook",
    "avatar": "hellen-hazel.avif"
  },
  "Laura Lawer": {
    "name": "Laura Lawer",
    "text": "Fantastic service from start to finish and would have no hesitation in recommending Alex and Sam. We now have the Spanish dream thanks to Solmar Homes. Alex and Sam don’t just help you buy the house they help you make it a home and take you through the process step by step. As a family we can’t thank them enough.",
    "source": "facebook",
    "avatar": "laura-lawer.avif"
  },
  "Suzzane Addison": {
    "name": "Suzzane Addison",
    "text": "“Just want to thank you both Alex and Sam for helping us find our dream home in Spain. We couldn't have done it without all your knowledge and  experience.”",
    "source": "facebook",
    "avatar": "suzzane-addison.png"
  },
  "Hilary Lapedis": {
    "name": "Hilary Lapedis",
    "text": "After apartment  hunting for a while, we were lucky to find Alex and Vick.  They both brought aprofessional approach but perhaps even more importantly, was their help before and after purchase in helping us source building services and removal and in many other ways.  We recommend them wholeheartedly for their full, friendly and professional help.",
    "source": "google",
    "avatar": "hilary-lapedis.svg"
  },
  "Ian Forester": {
    "name": "Ian Forester",
    "text": "It’s been 6 months since we purchased our beautiful Penthouse Apartment in Hacienda Riquelme.And dare I say it ,one of the best things we have ever done.I also want people to know , the best way to buy is with a good honest estate agent , we found all were helpful , but Alex at Solmar went the extra Mile...if not further .....he listened to our requirements and found the perfect property ,he held our hands all the way through the buying process, sorted Lawyers for us, and was there right up to the days the keys were handed to us.We are now settled in and really pleased with it , so looking forward to many exciting years holidaying and then semi retiring in this wonderful resort. Big thanks to Alex and Sam.",
    "source": "facebook",
    "avatar": "ian-forester.avif"
  },
  "Neil Warburton": {
    "name": "Neil Warburton",
    "text": "“Alex & Sam have been amazing nothing is to much trouble even driving us around the shops for furniture etc after we’ve purchased and taking care of all the little jobs and keeping us updated with photos and info we would highly recommend thanks guys”",
    "source": "facebook"
  },
  "Mark Williamson": {
    "name": "Mark Williamson",
    "text": "“Marian and I had thought about buying a holiday home in Spain for many years but didn't fancy the hard sell, or paid for buying trips and being put under pressure.\n\nAfter many years we decided this year was the year we knew we wanted the area around The Mar Menor so joined a forum for Mar Menor Residents, and were accepted onto the forum, it was a mine of info, the best being the recommendation that if we were buying to speak to Alex Moreno and  Sam Moreno, I can only say that was the best advice we ever had.We had an initial free consultation with them, which was great, but this through up a lot more questions, taxes, solicitors, NIE Numbers, electricity water internet, to name but a few.We need never have worried it felt like both Alex and Sam were at our beckon call from that 1st day, from the trip over and after multiple viewings we found it OUR Home in Spain.We celebrated with a glass or two.”",
    "source": "facebook",
    "avatar": "mark-williamson.avif"
  }
};

/** The three scrolling columns, by reviewer name. */
export const reviewColumns: string[][] = [
  [
    "Nichola Hindle-Marsh",
    "Eugen Hanley",
    "Hellen Hazel",
    "Laura Lawer"
  ],
  [
    "Suzzane Addison",
    "Hilary Lapedis",
    "Ian Forester"
  ],
  [
    "Neil Warburton",
    "Mark Williamson",
    "Laura Lawer"
  ]
];
